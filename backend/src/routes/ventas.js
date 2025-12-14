// src/routes/ventas.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"
import PDFDocument from "pdfkit"

const router = Router()

/* ======================================================================
   HELPERS COMPARTIDOS
   ====================================================================== */

function getUsuarioIdFromReq(req) {
  const headerId = req.headers["x-user-id"] || req.headers["x-userid"]
  const parsedHeader = headerId ? Number(headerId) : null
  if (Number.isFinite(parsedHeader)) return parsedHeader

  // ✅ Fallback: el frontend (POS) manda usuario_id en el body
  const bodyId = req?.body?.usuario_id
  const parsedBody = bodyId !== undefined && bodyId !== null ? Number(bodyId) : null
  if (Number.isFinite(parsedBody)) return parsedBody

  if (req.user && req.user.id) return Number(req.user.id)
  return null
}

function getClientInfo(req) {
  const rawIp =
    (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    null

  const userAgent = req.headers["user-agent"] || null
  return { ip: rawIp, userAgent }
}

function formatCLP(value) {
  const n = Number(value || 0)
  try {
    return n.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    })
  } catch {
    return `$${Math.round(n).toLocaleString("es-CL")}`
  }
}

// Auditoría GENERAL (tabla auditoria, modulo = 'ventas')
async function registrarAuditoriaVentas({ req, accion, entidadId, datosAntes, datosDespues }) {
  try {
    const usuario_id = getUsuarioIdFromReq(req)
    const { ip, userAgent } = getClientInfo(req)

    const { error } = await supabase.from("auditoria").insert([
      {
        usuario_id: usuario_id ?? null,
        modulo: "ventas",
        accion,
        entidad: "ventas",
        entidad_id: entidadId ?? null,
        datos_antes: datosAntes ?? null,
        datos_despues: datosDespues ?? null,
        ip,
        user_agent: userAgent,
      },
    ])

    if (error) console.error("❌ Error creando registro en auditoria (ventas):", error)
  } catch (err) {
    console.error("❌ Error inesperado registrando auditoria ventas:", err)
  }
}

// Movimiento + auditoria_movimientos asociado a una venta
async function registrarMovimientoVenta(req, barrilId, ventaId, payload) {
  try {
    if (!barrilId || !ventaId) return

    const usuario_id = getUsuarioIdFromReq(req)
    const { ip, userAgent } = getClientInfo(req)

    const movimiento = {
      barril_id: barrilId,
      usuario_id: usuario_id ?? null,
      tipo_movimiento: payload.tipo_movimiento || "VENTA_POS",
      ubicacion_origen: payload.ubicacion_origen ?? null,
      ubicacion_destino: payload.ubicacion_destino ?? null,
      origen_bodega_id: payload.origen_bodega_id ?? null,
      destino_bodega_id: payload.destino_bodega_id ?? null,
      observaciones: payload.observaciones ?? null,
      venta_id: ventaId,
    }

    const { data: mov, error: movError } = await supabase
      .from("movimientos")
      .insert([movimiento])
      .select("*")
      .single()

    if (movError) {
      console.error("❌ Error creando movimiento de venta:", movError)
      return
    }

    const { error: audError } = await supabase.from("auditoria_movimientos").insert([
      {
        usuario_id: usuario_id ?? null,
        movimiento_id: mov.id,
        barril_id: barrilId,
        accion: "CREAR",
        datos_antes: null,
        datos_despues: mov,
        ip,
        user_agent: userAgent,
      },
    ])

    if (audError) console.error("❌ Error creando auditoria_movimientos (venta):", audError)
  } catch (err) {
    console.error("❌ Error inesperado registrando movimiento venta:", err)
  }
}

/* ======================================================================
   LÓGICA DE LITROS RESTANTES
   ====================================================================== */

async function descontarLitrosDeBarril(barrilId, litrosVendidos) {
  try {
    if (!barrilId || !litrosVendidos || litrosVendidos <= 0) return

    const { data: barril, error: barrilError } = await supabase
      .from("barriles")
      .select("id, litros_restantes, capacidad_litros, estado_actual")
      .eq("id", barrilId)
      .maybeSingle()

    if (barrilError) {
      console.error("❌ Error obteniendo barril para descontar litros:", barrilError)
      return
    }
    if (!barril) return

    const actuales = Number(barril.litros_restantes ?? barril.capacidad_litros ?? 0) || 0
    const nuevosLitros = Math.max(0, actuales - litrosVendidos)

    const updatePayload = { litros_restantes: nuevosLitros }
    if (nuevosLitros <= 0) updatePayload.estado_actual = "AGOTADO"

    const { error: updError } = await supabase.from("barriles").update(updatePayload).eq("id", barrilId)
    if (updError) console.error("❌ Error actualizando litros_restantes del barril:", updError)
  } catch (err) {
    console.error("❌ Error inesperado descontando litros del barril:", err)
  }
}

async function vaciarBarril(barrilId) {
  try {
    if (!barrilId) return

    const { error } = await supabase
      .from("barriles")
      .update({ litros_restantes: 0, estado_actual: "AGOTADO" })
      .eq("id", barrilId)

    if (error) console.error("❌ Error vaciando barril:", error)
  } catch (err) {
    console.error("❌ Error inesperado vaciando barril:", err)
  }
}

/* ======================================================================
   RUTAS
   ====================================================================== */

/**
 * GET /api/ventas
 */
router.get("/", async (req, res, next) => {
  try {
    const { desde, hasta } = req.query

    // ✅ FK explícito para asegurar join correcto del usuario
    let query = supabase
      .from("ventas")
      .select(
        `*,
         usuarios!ventas_usuario_id_fkey(nombre_completo,rol),
         clientes(nombre,rut),
         bodegas(nombre),
         venta_detalle(barril_id,cantidad,unidad,precio_unitario,subtotal)`
      )
      .order("fecha_hora", { ascending: false })

    if (desde) query = query.gte("fecha_hora", desde)
    if (hasta) query = query.lte("fecha_hora", hasta)

    const { data, error } = await query

    if (error) {
      console.error("❌ Error Supabase en GET /api/ventas:", error)
      return res.status(500).json({ error: "Error al obtener las ventas", details: error.message })
    }

    res.json(data || [])
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/ventas:", err)
    next(err)
  }
})

/**
 * GENERAR BOLETA PDF: GET /api/ventas/pdf/:id
 */
router.get("/pdf/:id", async (req, res) => {
  try {
    const ventaId = Number(req.params.id)
    if (!ventaId) return res.status(400).json({ error: "ID inválido" })

    // ✅ Traer usuario también (FK explícito)
    const { data: venta, error: errorVenta } = await supabase
      .from("ventas")
      .select(
        `*,
         usuarios!ventas_usuario_id_fkey(nombre_completo,rol),
         clientes(nombre,rut),
         bodegas(nombre)`
      )
      .eq("id", ventaId)
      .maybeSingle()

    if (errorVenta) {
      console.error("Error obteniendo venta:", errorVenta)
      return res.status(500).json({ error: "Error obteniendo venta" })
    }
    if (!venta) return res.status(404).json({ error: "Venta no encontrada" })

    const { data: detalle, error: errorDetalle } = await supabase
      .from("venta_detalle")
      .select("*")
      .eq("venta_id", ventaId)

    if (errorDetalle) {
      console.error("Error obteniendo detalle:", errorDetalle)
      return res.status(500).json({ error: "Error obteniendo detalle" })
    }

    const barrilIds = [...new Set((detalle || []).map((d) => d.barril_id).filter(Boolean))]
    let barrilesMap = {}

    if (barrilIds.length > 0) {
      const { data: barriles, error: errorBarriles } = await supabase
        .from("barriles")
        .select("id, codigo_interno, tipo_cerveza")
        .in("id", barrilIds)

      if (!errorBarriles) {
        barrilesMap = (barriles || []).reduce((acc, b) => {
          acc[b.id] = b
          return acc
        }, {})
      } else {
        console.error("Error obteniendo barriles:", errorBarriles)
      }
    }

    const doc = new PDFDocument({ margin: 40 })

    res.setHeader("Content-Type", "application/pdf")
    // si quieres forzar descarga: attachment; filename=...
    res.setHeader("Content-Disposition", `inline; filename="boleta_${ventaId}.pdf"`)

    doc.pipe(res)

    doc.fontSize(22).text("BrewMaster - Recibo de Venta", { align: "center" }).moveDown()

    doc
      .fontSize(12)
      .text(`Documento: ${venta.tipo_documento}${venta.numero_documento ? ` #${venta.numero_documento}` : ""}`)
      .text(`Fecha: ${venta.fecha_hora ? new Date(venta.fecha_hora).toLocaleString("es-CL") : "—"}`)
      .moveDown(0.5)

    // ✅ Usuario que realizó la venta
    const userName = venta?.usuarios?.nombre_completo || (venta?.usuario_id ? `Usuario #${venta.usuario_id}` : "—")
    const userRol = (venta?.usuarios?.rol || "—").toString().toUpperCase()
    doc.text(`Usuario: ${userName} (${userRol})`).moveDown(0.5)

    doc.fontSize(16).text("Datos del Cliente", { underline: true })
    doc.fontSize(12)

    if (venta.clientes) {
      doc.text(`Nombre: ${venta.clientes.nombre}`).text(`RUT: ${venta.clientes.rut || "—"}`)
    } else {
      doc.text("Cliente: Venta sin cliente asociado")
    }

    doc.moveDown()

    doc.fontSize(16).text("Detalle de la Venta", { underline: true }).moveDown(0.5)

    let total = 0
    ;(detalle || []).forEach((item) => {
      const barrilInfo = barrilesMap[item.barril_id] || {}
      const nombre = barrilInfo.tipo_cerveza || "Barril"
      const codigo = barrilInfo.codigo_interno || item.barril_id

      doc
        .fontSize(12)
        .text(`${nombre} (${codigo})`)
        .text(
          `Cantidad: ${item.cantidad} ${item.unidad} - P. Unit: $${Number(item.precio_unitario).toLocaleString("es-CL")}`
        )
        .text(`Subtotal: $${Number(item.subtotal).toLocaleString("es-CL")}`)
        .moveDown(0.5)

      total += Number(item.subtotal) || 0
    })

    doc.moveDown()
    doc.fontSize(14).text(`TOTAL: $${Number(total).toLocaleString("es-CL")}`, { align: "right" })

    doc.end()
  } catch (err) {
    console.error("Error generando PDF:", err)
    res.status(500).json({ error: "Error generando PDF" })
  }
})

/**
 * EXPORTAR PDF POR DÍA: GET /api/ventas/pdf-dia?dia=YYYY-MM-DD&caja_id?
 */
router.get("/pdf-dia", async (req, res) => {
  try {
    const { dia, caja_id } = req.query
    const diaStr = String(dia || "").trim()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(diaStr)) {
      return res.status(400).json({ error: "Parámetro 'dia' inválido (YYYY-MM-DD)" })
    }

    // ✅ RANGO EN HORA LOCAL (sin 'Z'), para que no se corra el día en Chile
    const start = new Date(`${diaStr}T00:00:00`)
    const end = new Date(`${diaStr}T23:59:59.999`)

    let query = supabase
      .from("ventas")
      .select(
        `id, fecha_hora, tipo_documento, numero_documento, metodo_pago,
         total_bruto, descuento_total, total_neto, estado, observaciones, caja_id,
         usuarios!ventas_usuario_id_fkey(nombre_completo,rol)`
      )
      .gte("fecha_hora", start.toISOString())
      .lte("fecha_hora", end.toISOString())
      .order("fecha_hora", { ascending: false })

    const cajaIdNum =
      caja_id !== undefined && caja_id !== null && String(caja_id).trim() !== "" ? Number(caja_id) : null

    if (Number.isFinite(cajaIdNum)) query = query.eq("caja_id", cajaIdNum)

    const { data: ventasDia, error } = await query
    if (error) {
      console.error("❌ Error Supabase en GET /api/ventas/pdf-dia:", error)
      return res.status(500).json({ error: "Error generando PDF del día", details: error.message })
    }

    const lista = Array.isArray(ventasDia) ? ventasDia : []
    const totalDia = lista.reduce((s, v) => s + Number(v?.total_neto ?? v?.total_bruto ?? 0), 0)

    const doc = new PDFDocument({ margin: 40 })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `inline; filename="reporte_ventas_${diaStr}${Number.isFinite(cajaIdNum) ? `_caja_${cajaIdNum}` : ""}.pdf"`
    )
    doc.pipe(res)

    doc.fontSize(20).text("BrewMaster - Reporte de Ventas (Día)", { align: "center" }).moveDown(0.5)
    doc
      .fontSize(12)
      .text(`Día: ${diaStr}${Number.isFinite(cajaIdNum) ? `  |  Caja: #${cajaIdNum}` : ""}`)
      .text(`Total día: ${formatCLP(totalDia)}`)
      .moveDown(1)

    doc.fontSize(11).text("Fecha", 40, doc.y, { continued: true })
    doc.text("Documento", 150, doc.y, { continued: true })
    doc.text("Usuario (rol)", 270, doc.y, { continued: true })
    doc.text("Pago", 400, doc.y, { continued: true })
    doc.text("Total", 470, doc.y)
    doc.moveDown(0.3)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#666").stroke()
    doc.moveDown(0.5)

    lista.forEach((v) => {
      const fechaTxt = v?.fecha_hora ? new Date(v.fecha_hora).toLocaleString("es-CL") : "-"
      const docTxt = `${v?.tipo_documento || "—"}${v?.numero_documento ? ` #${v.numero_documento}` : ""}`
      const userName = v?.usuarios?.nombre_completo || (v?.usuario_id ? `Usuario #${v.usuario_id}` : "—")
      const userRol = (v?.usuarios?.rol || "—").toString().toUpperCase()
      const userTxt = `${userName} (${userRol})`
      const pagoTxt = (v?.metodo_pago || "OTRO").toString().toUpperCase()
      const totalTxt = formatCLP(v?.total_neto ?? v?.total_bruto ?? 0)

      const y = doc.y
      doc.fontSize(10).fillColor("#000")
      doc.text(fechaTxt, 40, y, { width: 110 })
      doc.text(docTxt, 150, y, { width: 110 })
      doc.text(userTxt, 270, y, { width: 125 })
      doc.text(pagoTxt, 400, y, { width: 60 })
      doc.text(totalTxt, 470, y, { width: 85, align: "right" })
      doc.moveDown(0.4)

      if (doc.y > 740) doc.addPage()
    })

    doc.end()
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/ventas/pdf-dia:", err)
    return res.status(500).json({ error: "Error inesperado generando PDF" })
  }
})

/**
 * Buscar venta por folio: GET /api/ventas/folio/:folio
 */
router.get("/folio/:folio", async (req, res, next) => {
  try {
    const folio = (req.params.folio || "").trim()
    if (!folio) return res.status(400).json({ error: "Folio inválido" })

    const { data, error } = await supabase
      .from("ventas")
      .select(
        `*,
         usuarios!ventas_usuario_id_fkey(nombre_completo,rol),
         clientes(nombre,rut),
         bodegas(nombre),
         venta_detalle(barril_id,cantidad,unidad,precio_unitario,subtotal)`
      )
      .eq("numero_documento", folio)
      .maybeSingle()

    if (error) {
      console.error("❌ Error Supabase en GET /api/ventas/folio/:folio:", error)
      return res.status(500).json({ error: "Error al buscar venta", details: error.message })
    }

    if (!data) return res.status(404).json({ error: "Venta no encontrada" })
    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/ventas/folio/:folio:", err)
    next(err)
  }
})

/**
 * GET /api/ventas/siguiente-numero
 */
router.get("/siguiente-numero", async (req, res) => {
  try {
    const { data, error } = await supabase.from("ventas").select("id").order("id", { ascending: false }).limit(1)
    if (error) return res.status(500).json({ error: "Error obteniendo correlativo" })

    const lastId = data?.[0]?.id ? Number(data[0].id) : 0
    res.json({ nextNumero: lastId + 1 })
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo correlativo" })
  }
})

/**
 * POST /api/ventas
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      caja_id,
      cliente_id,
      bodega_id,
      tipo_documento,
      numero_documento,
      metodo_pago,
      descuento_total,
      observaciones,
      items,
      usuario_id, // 👈 (opcional) si viene, lo usa el helper
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "La venta debe incluir al menos un item" })
    }
    if (!tipo_documento) return res.status(400).json({ error: "tipo_documento es requerido" })

    const cajaId =
      caja_id === null || caja_id === undefined || String(caja_id).trim() === "" ? null : Number(caja_id)

    let total_bruto = 0
    const detalleItems = items.map((item) => {
      const cantidad = Number(item.cantidad) || 0
      const precio_unitario = Number(item.precio_unitario) || 0
      const subtotal = cantidad * precio_unitario
      total_bruto += subtotal

      return {
        barril_id: item.barril_id,
        cantidad,
        unidad: item.unidad || "BARRIL",
        precio_unitario,
        subtotal,
      }
    })

    const desc = Number(descuento_total) || 0
    const total_neto = total_bruto - desc

    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert([
        {
          caja_id: Number.isFinite(cajaId) ? cajaId : null,
          usuario_id: getUsuarioIdFromReq(req), // ✅ toma header o body.usuario_id
          cliente_id: cliente_id || null,
          bodega_id: bodega_id || null,
          tipo_documento,
          numero_documento: numero_documento || null,
          metodo_pago: metodo_pago || null,
          total_bruto,
          descuento_total: desc,
          total_neto,
          estado: "COMPLETADA",
          observaciones: observaciones || null,
        },
      ])
      .select("*")
      .single()

    if (ventaError) {
      console.error("❌ Error Supabase al crear venta:", ventaError)
      return res.status(500).json({ error: "Error al crear la venta", details: ventaError.message })
    }

    const ventaId = venta.id

    const detalleConVenta = detalleItems.map((d) => ({ ...d, venta_id: ventaId }))

    const { error: detalleError } = await supabase.from("venta_detalle").insert(detalleConVenta)
    if (detalleError) {
      console.error("❌ Error Supabase al crear detalle de venta:", detalleError)
      return res.status(500).json({ error: "Error al guardar el detalle de la venta", details: detalleError.message })
    }

    for (const d of detalleConVenta) {
      const barrilId = d.barril_id

      await registrarMovimientoVenta(req, barrilId, ventaId, {
        tipo_movimiento: "VENTA_POS",
        origen_bodega_id: bodega_id || null,
        destino_bodega_id: null,
        ubicacion_origen: null,
        ubicacion_destino: "CLIENTE",
        observaciones: `Venta POS ${tipo_documento} ${numero_documento || ""}`.trim(),
      })

      if (d.unidad === "LITRO") {
        const litrosVendidos = Number(d.cantidad) || 0
        await descontarLitrosDeBarril(barrilId, litrosVendidos)
      } else if (d.unidad === "BARRIL") {
        await vaciarBarril(barrilId)
      }
    }

    await registrarAuditoriaVentas({
      req,
      accion: "CREAR",
      entidadId: ventaId,
      datosAntes: null,
      datosDespues: { ...venta, items: detalleItems },
    })

    res.status(201).json({ ...venta, items: detalleItems })
  } catch (err) {
    console.error("❌ Error inesperado en POST /api/ventas:", err)
    next(err)
  }
})

export default router
