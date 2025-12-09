// src/routes/ventas.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"
import PDFDocument from "pdfkit";

const router = Router()

/* ======================================================================
   HELPERS COMPARTIDOS (similar a barriles.js)
   ====================================================================== */

function getUsuarioIdFromReq(req) {
  const headerId = req.headers["x-user-id"] || req.headers["x-userid"]
  const parsedHeader = headerId ? Number(headerId) : null
  if (Number.isFinite(parsedHeader)) return parsedHeader
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

// Auditoría GENERAL (tabla auditoria, modulo = 'ventas')
async function registrarAuditoriaVentas({
  req,
  accion, // 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'
  entidadId,
  datosAntes,
  datosDespues,
}) {
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

    if (error) {
      console.error("❌ Error creando registro en auditoria (ventas):", error)
    }
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

    const { error: audError } = await supabase
      .from("auditoria_movimientos")
      .insert([
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

    if (audError) {
      console.error("❌ Error creando auditoria_movimientos (venta):", audError)
    }
  } catch (err) {
    console.error("❌ Error inesperado registrando movimiento venta:", err)
  }
}

/* ======================================================================
   LÓGICA DE LITROS RESTANTES
   ====================================================================== */

/**
 * Descuenta litros de un barril.
 * - Si litrosVendidos > 0 => litros_restantes = max(0, litros_restantes - litrosVendidos)
 * - Si llega a 0 => estado_actual = 'AGOTADO' (opcional)
 */
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

    const actuales =
      Number(barril.litros_restantes ?? barril.capacidad_litros ?? 0) || 0

    const nuevosLitros = Math.max(0, actuales - litrosVendidos)

    const updatePayload = {
      litros_restantes: nuevosLitros,
    }

    if (nuevosLitros <= 0) {
      updatePayload.estado_actual = "AGOTADO"
    }

    const { error: updError } = await supabase
      .from("barriles")
      .update(updatePayload)
      .eq("id", barrilId)

    if (updError) {
      console.error("❌ Error actualizando litros_restantes del barril:", updError)
    }
  } catch (err) {
    console.error("❌ Error inesperado descontando litros del barril:", err)
  }
}

/**
 * Vende el barril completo:
 * - deja litros_restantes = 0
 * - marca estado_actual = 'AGOTADO'
 */
async function vaciarBarril(barrilId) {
  try {
    if (!barrilId) return

    const { error } = await supabase
      .from("barriles")
      .update({
        litros_restantes: 0,
        estado_actual: "AGOTADO",
      })
      .eq("id", barrilId)

    if (error) {
      console.error("❌ Error vaciando barril:", error)
    }
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

    let query = supabase
      .from("ventas")
      .select(
        "*, clientes(nombre,rut), bodegas(nombre), venta_detalle(barril_id,cantidad,unidad,precio_unitario,subtotal)"
      )
      .order("fecha_hora", { ascending: false })

    if (desde) query = query.gte("fecha_hora", desde)
    if (hasta) query = query.lte("fecha_hora", hasta)

    const { data, error } = await query

    if (error) {
      console.error("❌ Error Supabase en GET /api/ventas:", error)
      return res.status(500).json({
        error: "Error al obtener las ventas",
        details: error.message,
      })
    }

    res.json(data || [])
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/ventas:", err)
    next(err)
  }
})

/**
 * GET /api/ventas/siguiente-numero
 *  -> devuelve el próximo correlativo basado en MAX(id) + 1
 *     (si no hay ventas, devuelve 1)
 */
router.get("/siguiente-numero", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ventas")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)

    if (error) {
      console.error("❌ Error obteniendo siguiente numero de venta:", error)
      return res.status(500).json({ error: "Error obteniendo correlativo" })
    }

    const lastId = data && data.length > 0 ? data[0].id : 0
    const nextNumero = (lastId || 0) + 1

    return res.json({ nextNumero })
  } catch (err) {
    console.error("❌ Error inesperado obteniendo siguiente numero de venta:", err)
    return res.status(500).json({ error: "Error obteniendo correlativo" })
  }
})

/**
 * GET /api/ventas/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de venta inválido" })
    }

    const { data, error } = await supabase
      .from("ventas")
      .select(
        "*, clientes(nombre,rut), bodegas(nombre), venta_detalle(barril_id,cantidad,unidad,precio_unitario,subtotal)"
      )
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("❌ Error Supabase en GET /api/ventas/:id:", error)
      return res.status(500).json({
        error: "Error al obtener la venta",
        details: error.message,
      })
    }

    if (!data) {
      return res.status(404).json({ error: "Venta no encontrada" })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/ventas/:id:", err)
    next(err)
  }
})

/**
 * POST /api/ventas
 *
 * Body esperado (ejemplo):
 * {
 *   cliente_id: 1 | null,
 *   bodega_id: 1 | null,
 *   tipo_documento: 'BOLETA',
 *   numero_documento: '000123',
 *   metodo_pago: 'EFECTIVO',
 *   descuento_total: 0,
 *   observaciones: 'Venta POS',
 *   items: [
 *     { barril_id: 10, cantidad: 0.5, unidad: 'LITRO', precio_unitario: 3000 },
 *     { barril_id: 10, cantidad: 1, unidad: 'LITRO', precio_unitario: 5800 },
 *     { barril_id: 22, cantidad: 1, unidad: 'BARRIL', precio_unitario: 50000 }
 *   ]
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      cliente_id,
      bodega_id,
      tipo_documento,
      numero_documento,
      metodo_pago,
      descuento_total,
      observaciones,
      items,
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "La venta debe incluir al menos un item" })
    }

    if (!tipo_documento) {
      return res.status(400).json({ error: "tipo_documento es requerido" })
    }

    // Calcular totales
    let total_bruto = 0
    const detalleItems = items.map((item) => {
      const cantidad = Number(item.cantidad) || 0
      const precio_unitario = Number(item.precio_unitario) || 0
      const subtotal = cantidad * precio_unitario
      total_bruto += subtotal

      return {
        barril_id: item.barril_id,
        cantidad,
        unidad: item.unidad || "BARRIL", // si no viene, asumimos barril completo
        precio_unitario,
        subtotal,
      }
    })

    const desc = Number(descuento_total) || 0
    const total_neto = total_bruto - desc

    // 1) Insert en VENTAS
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert([
        {
          usuario_id: getUsuarioIdFromReq(req),
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
      return res.status(500).json({
        error: "Error al crear la venta",
        details: ventaError.message,
      })
    }

    const ventaId = venta.id

    // 2) Insert en VENTA_DETALLE
    const detalleConVenta = detalleItems.map((d) => ({
      ...d,
      venta_id: ventaId,
    }))

    const { error: detalleError } = await supabase
      .from("venta_detalle")
      .insert(detalleConVenta)

    if (detalleError) {
      console.error("❌ Error Supabase al crear detalle de venta:", detalleError)
      return res.status(500).json({
        error: "Error al guardar el detalle de la venta",
        details: detalleError.message,
      })
    }

    // 3) Registrar movimientos (salida de stock) y descontar litros
    for (const d of detalleConVenta) {
      const barrilId = d.barril_id

      // Movimiento
      await registrarMovimientoVenta(req, barrilId, ventaId, {
        tipo_movimiento: "VENTA_POS",
        origen_bodega_id: bodega_id || null,
        destino_bodega_id: null,
        ubicacion_origen: null,
        ubicacion_destino: "CLIENTE",
        observaciones: `Venta POS ${tipo_documento} ${numero_documento || ""}`.trim(),
      })

      // Litros vendidos
      if (d.unidad === "LITRO") {
        const litrosVendidos = Number(d.cantidad) || 0
        await descontarLitrosDeBarril(barrilId, litrosVendidos)
      } else if (d.unidad === "BARRIL") {
        await vaciarBarril(barrilId)
      }
    }

    // 4) Auditoría general
    await registrarAuditoriaVentas({
      req,
      accion: "CREAR",
      entidadId: ventaId,
      datosAntes: null,
      datosDespues: {
        ...venta,
        items: detalleItems,
      },
    })

    // 5) Devolver venta + items
    res.status(201).json({
      ...venta,
      items: detalleItems,
    })
  } catch (err) {
    console.error("❌ Error inesperado en POST /api/ventas:", err)
    next(err)
  }
})

// ======================================================
// GENERAR BOLETA PDF: GET /api/ventas/pdf/:id
// ======================================================
router.get("/pdf/:id", async (req, res) => {
  try {
    const ventaId = Number(req.params.id);
    if (!ventaId) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // 1) OBTENER VENTA
    const { data: venta, error: errorVenta } = await supabase
      .from("ventas")
      .select("*, clientes(nombre,rut), bodegas(nombre)")
      .eq("id", ventaId)
      .maybeSingle();

    if (errorVenta) {
      console.error("Error obteniendo venta:", errorVenta);
      return res.status(500).json({ error: "Error obteniendo venta" });
    }

    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // 2) OBTENER DETALLE (SIN JOINS)
    const { data: detalle, error: errorDetalle } = await supabase
      .from("venta_detalle")
      .select("*")
      .eq("venta_id", ventaId);

    if (errorDetalle) {
      console.error("Error obteniendo detalle:", errorDetalle);
      return res.status(500).json({ error: "Error obteniendo detalle" });
    }

    // 3) OBTENER BARRILES USADOS EN EL DETALLE
    const barrilIds = [
      ...new Set(detalle.map((d) => d.barril_id).filter(Boolean)),
    ];

    let barrilesMap = {};
    if (barrilIds.length > 0) {
      const { data: barriles, error: errorBarriles } = await supabase
        .from("barriles")
        .select("id, codigo_interno, tipo_cerveza")
        .in("id", barrilIds);

      if (errorBarriles) {
        console.error("Error obteniendo barriles:", errorBarriles);
      } else {
        barrilesMap = (barriles || []).reduce((acc, b) => {
          acc[b.id] = b;
          return acc;
        }, {});
      }
    }

    // ============ INICIO PDF ============
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="boleta_${ventaId}.pdf"`
    );

    doc.pipe(res);

    // ------------------------
    // ENCABEZADO
    // ------------------------
    doc
      .fontSize(22)
      .text("BrewMaster - Recibo de Venta", { align: "center" })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Venta N°: ${venta.numero_documento}`)
      .text(`Fecha: ${new Date(venta.fecha_hora).toLocaleString()}`)
      .moveDown();

    // ------------------------
    // CLIENTE
    // ------------------------
    doc.fontSize(16).text("Datos del Cliente", { underline: true });
    doc.fontSize(12);

    if (venta.clientes) {
      doc
        .text(`Nombre: ${venta.clientes.nombre}`)
        .text(`RUT: ${venta.clientes.rut || "—"}`);
    } else {
      doc.text("Cliente: Venta sin cliente asociado");
    }

    doc.moveDown();

    // ------------------------
    // DETALLE
    // ------------------------
    doc.fontSize(16).text("Detalle de la Venta", { underline: true });
    doc.moveDown();

    detalle.forEach((item) => {
      const barril = barrilesMap[item.barril_id] || {};
      const nombreCerveza = barril.tipo_cerveza || "Cerveza";
      const codigoInterno = barril.codigo_interno || "—";

      doc
        .fontSize(12)
        .text(`${nombreCerveza} | Barril ${codigoInterno}`)
        .text(
          `Cantidad: ${item.cantidad} ${item.unidad} — Precio unit: $${Number(
            item.precio_unitario
          ).toLocaleString()}`
        )
        .text(
          `Subtotal: $${Number(item.subtotal || 0).toLocaleString()}`
        )
        .moveDown(0.5);
    });

    doc.moveDown();

    // ------------------------
    // TOTALES
    // ------------------------
    doc.fontSize(16).text("Totales", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text(
      `Total Bruto: $${Number(venta.total_bruto || 0).toLocaleString()}`
    );
    doc.text(
      `Descuento: $${Number(venta.descuento_total || 0).toLocaleString()}`
    );
    doc.text(
      `Total Neto: $${Number(venta.total_neto || 0).toLocaleString()}`
    );

    doc.moveDown(2);

    doc.fontSize(13).text("Gracias por su compra", { align: "center" });

    // Finalizar PDF
    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});



export default router
