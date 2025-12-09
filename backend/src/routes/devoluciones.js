// src/routes/devoluciones.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

/* ======================================================================
   HELPERS COMPARTIDOS (similar a ventas.js / barriles.js)
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

// Auditoría GENERAL (modulo = 'devoluciones')
async function registrarAuditoriaDevoluciones({
  req,
  accion,
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
        modulo: "devoluciones",
        accion,
        entidad: "devoluciones",
        entidad_id: entidadId ?? null,
        datos_antes: datosAntes ?? null,
        datos_despues: datosDespues ?? null,
        ip,
        user_agent: userAgent,
      },
    ])

    if (error) {
      console.error(
        "❌ Error creando registro en auditoria (devoluciones):",
        error
      )
    }
  } catch (err) {
    console.error("❌ Error inesperado registrando auditoria devoluciones:", err)
  }
}

// Movimiento + auditoria_movimientos asociado a una devolución
async function registrarMovimientoDevolucion(
  req,
  barrilId,
  devolucionId,
  payload
) {
  try {
    if (!barrilId || !devolucionId) return

    const usuario_id = getUsuarioIdFromReq(req)
    const { ip, userAgent } = getClientInfo(req)

    const movimiento = {
      barril_id: barrilId,
      usuario_id: usuario_id ?? null,
      tipo_movimiento: payload.tipo_movimiento || "DEVOLUCION_CLIENTE",
      ubicacion_origen: payload.ubicacion_origen ?? null,
      ubicacion_destino: payload.ubicacion_destino ?? null,
      origen_bodega_id: payload.origen_bodega_id ?? null,
      destino_bodega_id: payload.destino_bodega_id ?? null,
      observaciones: payload.observaciones ?? null,
      devolucion_id: devolucionId,
    }

    const { data: mov, error: movError } = await supabase
      .from("movimientos")
      .insert([movimiento])
      .select("*")
      .single()

    if (movError) {
      console.error("❌ Error creando movimiento de devolución:", movError)
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
      console.error(
        "❌ Error creando auditoria_movimientos (devolución):",
        audError
      )
    }
  } catch (err) {
    console.error("❌ Error inesperado registrando movimiento devolución:", err)
  }
}

/* ======================================================================
   RUTAS
   ====================================================================== */

/**
 * GET /api/devoluciones
 * Lista devoluciones con cliente, venta y detalle
 */
router.get("/", async (req, res, next) => {
  try {
    const { desde, hasta } = req.query

    let query = supabase
      .from("devoluciones")
      .select(
        "*, clientes(nombre,rut), ventas(numero_documento,tipo_documento), devolucion_detalle(barril_id,cantidad,unidad,monto_linea)"
      )
      .order("fecha_hora", { ascending: false })

    if (desde) {
      query = query.gte("fecha_hora", desde)
    }
    if (hasta) {
      query = query.lte("fecha_hora", hasta)
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error Supabase en GET /api/devoluciones:", error)
      return res.status(500).json({
        error: "Error al obtener las devoluciones",
        details: error.message,
      })
    }

    res.json(data || [])
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/devoluciones:", err)
    next(err)
  }
})

/**
 * GET /api/devoluciones/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de devolución inválido" })
    }

    const { data, error } = await supabase
      .from("devoluciones")
      .select(
        "*, clientes(nombre,rut), ventas(numero_documento,tipo_documento), devolucion_detalle(barril_id,cantidad,unidad,monto_linea)"
      )
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("❌ Error Supabase en GET /api/devoluciones/:id:", error)
      return res.status(500).json({
        error: "Error al obtener la devolución",
        details: error.message,
      })
    }

    if (!data) {
      return res.status(404).json({ error: "Devolución no encontrada" })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/devoluciones/:id:", err)
    next(err)
  }
})

/**
 * POST /api/devoluciones
 *
 * Body esperado (ejemplo):
 * {
 *   venta_id: 1 | null,
 *   cliente_id: 1 | null,
 *   tipo_devolucion: 'CLIENTE',
 *   motivo: 'Producto defectuoso',
 *   observaciones: 'Barril con fuga',
 *   bodega_id_retorno: 1,
 *   items: [
 *     { barril_id: 10, cantidad: 1, unidad: 'BARRIL', monto_linea: 45000 },
 *     ...
 *   ]
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      venta_id,
      cliente_id,
      tipo_devolucion,
      motivo,
      observaciones,
      bodega_id_retorno,
      items,
    } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "La devolución debe incluir al menos un item" })
    }

    const tipoDev = tipo_devolucion || "CLIENTE"

    // Calcular monto_total
    let monto_total = 0
    const detalleItems = items.map((item) => {
      const cantidad = Number(item.cantidad) || 0
      const monto_linea = Number(item.monto_linea) || 0
      monto_total += monto_linea

      return {
        barril_id: item.barril_id,
        cantidad,
        unidad: item.unidad || "BARRIL",
        monto_linea,
      }
    })

    // 1) Insert en DEVOLUCIONES
    const { data: devolucion, error: devError } = await supabase
      .from("devoluciones")
      .insert([
        {
          usuario_id: getUsuarioIdFromReq(req),
          venta_id: venta_id || null,
          cliente_id: cliente_id || null,
          tipo_devolucion: tipoDev,
          motivo: motivo || null,
          estado: "REGISTRADA",
          monto_total,
          observaciones: observaciones || null,
        },
      ])
      .select("*")
      .single()

    if (devError) {
      console.error("❌ Error Supabase al crear devolución:", devError)
      return res.status(500).json({
        error: "Error al crear la devolución",
        details: devError.message,
      })
    }

    const devolucionId = devolucion.id

    // 2) Insert en DEVOLUCION_DETALLE
    const detalleConDev = detalleItems.map((d) => ({
      ...d,
      devolucion_id: devolucionId,
    }))

    const { error: detError } = await supabase
      .from("devolucion_detalle")
      .insert(detalleConDev)

    if (detError) {
      console.error(
        "❌ Error Supabase al crear detalle de devolución:",
        detError
      )
      return res.status(500).json({
        error: "Error al guardar el detalle de la devolución",
        details: detError.message,
      })
    }

    // 3) Registrar movimientos (entrada de stock por devolución)
    for (const item of detalleItems) {
      await registrarMovimientoDevolucion(req, item.barril_id, devolucionId, {
        tipo_movimiento: "DEVOLUCION_CLIENTE",
        origen_bodega_id: null,
        destino_bodega_id: bodega_id_retorno || null,
        ubicacion_origen: "CLIENTE",
        ubicacion_destino: null,
        observaciones: `Devolución ${tipoDev} por motivo: ${motivo || ""}`.trim(),
      })
    }

    // 4) Auditoría general
    await registrarAuditoriaDevoluciones({
      req,
      accion: "CREAR",
      entidadId: devolucionId,
      datosAntes: null,
      datosDespues: {
        ...devolucion,
        items: detalleItems,
      },
    })

    res.status(201).json({
      ...devolucion,
      items: detalleItems,
    })
  } catch (err) {
    console.error("❌ Error inesperado en POST /api/devoluciones:", err)
    next(err)
  }
})

export default router
