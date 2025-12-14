import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function maskCajaForUser(caja, requesterUserId) {
  if (!caja) return null
  const reqId = requesterUserId ? Number(requesterUserId) : null
  const ownerId =
    caja?.usuario_apertura_id !== null && caja?.usuario_apertura_id !== undefined
      ? Number(caja.usuario_apertura_id)
      : null

  if (!reqId || !ownerId) return caja
  if (reqId !== ownerId) return { ...caja, monto_inicial: 0 }
  return caja
}

async function getCajaAbierta() {
  // Debe existir 0 o 1 (tu índice ux_caja_abierta lo garantiza)
  const { data, error } = await supabase
    .from("cajas")
    .select("*")
    .eq("estado", "ABIERTA")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data || null
}

function isUniqueCajaAbiertaError(err) {
  const code = err?.code
  const msg = String(err?.message || "")
  const details = String(err?.details || "")
  return (
    code === "23505" ||
    msg.toLowerCase().includes("duplicate key") ||
    msg.toLowerCase().includes("ux_caja_abierta") ||
    details.toLowerCase().includes("ux_caja_abierta")
  )
}

function getDayRangeISO() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

async function getCajaDelDiaDeUsuario(usuarioId) {
  const { startISO, endISO } = getDayRangeISO()

  const { data, error } = await supabase
    .from("cajas")
    .select("*")
    .eq("usuario_apertura_id", usuarioId)
    .gte("fecha_apertura", startISO)
    .lt("fecha_apertura", endISO)
    .order("fecha_apertura", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data || null
}

async function buildResumenCaja(cajaId) {
  const { data: caja, error: errCaja } = await supabase
    .from("cajas")
    .select("id,monto_inicial,monto_final,estado,fecha_apertura,fecha_cierre,usuario_apertura_id,usuario_cierre_id")
    .eq("id", cajaId)
    .maybeSingle()

  if (errCaja) throw new Error(errCaja.message)

  const { data: ventas, error: errVentas } = await supabase
    .from("ventas")
    .select("id,total_bruto,descuento_total,total_neto,metodo_pago,estado")
    .eq("caja_id", cajaId)
    .neq("estado", "ANULADA")

  if (errVentas) throw new Error(errVentas.message)

  const resumen = {
    caja_id: cajaId,
    estado: caja?.estado ?? null,
    fecha_apertura: caja?.fecha_apertura ?? null,
    fecha_cierre: caja?.fecha_cierre ?? null,
    usuario_apertura_id: caja?.usuario_apertura_id ?? null,
    usuario_cierre_id: caja?.usuario_cierre_id ?? null,

    monto_inicial: Number(caja?.monto_inicial || 0),
    monto_final: caja?.monto_final !== null && caja?.monto_final !== undefined ? Number(caja.monto_final) : null,

    cantidad_ventas: ventas?.length || 0,
    total_bruto: 0,
    total_descuento: 0,
    total_neto: 0,
    por_metodo: {},
  }

  for (const v of ventas || []) {
    const bruto = Number(v.total_bruto || 0)
    const desc = Number(v.descuento_total || 0)
    const neto = Number(v.total_neto || 0)
    const metodo = (v.metodo_pago || "OTRO").toUpperCase()

    resumen.total_bruto += bruto
    resumen.total_descuento += desc
    resumen.total_neto += neto

    if (!resumen.por_metodo[metodo]) resumen.por_metodo[metodo] = { ventas: 0, total_neto: 0 }
    resumen.por_metodo[metodo].ventas += 1
    resumen.por_metodo[metodo].total_neto += neto
  }

  resumen.total_con_inicial = resumen.monto_inicial + resumen.total_neto
  return resumen
}

async function insertMovimientos(tipo, usuarioId, barrilIds, extra = {}) {
  if (!Array.isArray(barrilIds) || barrilIds.length === 0) return 0

  const rows = barrilIds.map((id) => ({
    barril_id: id,
    usuario_id: usuarioId ?? null,
    tipo_movimiento: tipo,
    fecha_hora: new Date().toISOString(),
    ubicacion_origen: extra.ubicacion_origen ?? null,
    ubicacion_destino: extra.ubicacion_destino ?? null,
    observaciones: extra.observaciones ?? null,
    venta_id: extra.venta_id ?? null,
    devolucion_id: extra.devolucion_id ?? null,
  }))

  const { error } = await supabase.from("movimientos").insert(rows)
  if (error) throw new Error(error.message)
  return rows.length
}

// ---------------------------------------------------------
// GET /actual?usuario_id=
// - Si hay caja ABIERTA -> la devuelve (masked si no es dueño)
// - Si NO hay ABIERTA y viene usuario_id -> devuelve la caja del día de ese usuario (aunque esté CERRADA)
// ---------------------------------------------------------
router.get("/actual", async (req, res) => {
  try {
    const usuarioId = req.query?.usuario_id ? Number(req.query.usuario_id) : null

    const abierta = await getCajaAbierta()
    if (abierta) return res.json(maskCajaForUser(abierta, usuarioId))

    if (usuarioId) {
      const delDia = await getCajaDelDiaDeUsuario(usuarioId)
      return res.json(delDia || null)
    }

    return res.json(null)
  } catch {
    return res.status(500).json({ error: "Error obteniendo caja actual" })
  }
})

// ---------------------------------------------------------
// GET /resumen?caja_id=&usuario_id=
// ---------------------------------------------------------
router.get("/resumen", async (req, res) => {
  try {
    const cajaId = req.query?.caja_id ? Number(req.query.caja_id) : null
    const usuarioId = req.query?.usuario_id ? Number(req.query.usuario_id) : null
    if (!cajaId) return res.json(null)

    const resumen = await buildResumenCaja(cajaId)

    if (usuarioId && resumen.usuario_apertura_id && Number(resumen.usuario_apertura_id) !== Number(usuarioId)) {
      return res.json({
        ...resumen,
        monto_inicial: 0,
        total_con_inicial: resumen.total_neto,
      })
    }

    return res.json(resumen)
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error obteniendo resumen" })
  }
})

// ---------------------------------------------------------
// POST /abrir
// Reglas:
// - Si hay ABIERTA:
//    - mismo usuario: puede actualizar monto_inicial
//    - otro usuario: responde misma caja masked (monto_inicial 0)
// - Si NO hay ABIERTA:
//    - si existe caja del día de ese usuario -> reabre ESA misma (y puede actualizar monto_inicial)
//    - si no existe -> crea nueva (requiere monto_inicial)
// ---------------------------------------------------------
router.post("/abrir", async (req, res) => {
  try {
    const { usuario_id = null, monto_inicial = null, observaciones = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null

    if (!usuarioId) return res.status(400).json({ error: "usuario_id es requerido para abrir caja" })

    const montoInicialNum =
      monto_inicial !== null && monto_inicial !== undefined && monto_inicial !== ""
        ? Number(monto_inicial)
        : null

    if (montoInicialNum !== null && Number.isNaN(montoInicialNum)) {
      return res.status(400).json({ error: "monto_inicial inválido" })
    }

    // 1) Si hay ABIERTA: devolver/editar según dueño
    const cajaAbierta = await getCajaAbierta()
    if (cajaAbierta?.id) {
      const ownerId =
        cajaAbierta.usuario_apertura_id !== null && cajaAbierta.usuario_apertura_id !== undefined
          ? Number(cajaAbierta.usuario_apertura_id)
          : null

      if (ownerId === usuarioId) {
        if (montoInicialNum !== null) {
          const { data: upd, error: errUpd } = await supabase
            .from("cajas")
            .update({
              monto_inicial: montoInicialNum,
              observaciones: observaciones ?? cajaAbierta.observaciones ?? null,
            })
            .eq("id", cajaAbierta.id)
            .select("*")
            .single()

          if (errUpd) return res.status(500).json({ error: errUpd.message })
          return res.json(upd)
        }
        return res.json(cajaAbierta)
      }

      return res.json(maskCajaForUser(cajaAbierta, usuarioId))
    }

    // 2) No hay ABIERTA -> ¿existe caja del día de ESTE usuario? (aunque esté cerrada)
    const cajaDelDia = await getCajaDelDiaDeUsuario(usuarioId)
    if (cajaDelDia?.id) {
      // Reabrir la caja del día del mismo usuario
      const patch = {
        estado: "ABIERTA",
        fecha_cierre: null,
        usuario_cierre_id: null,
        monto_final: null,
        observaciones: observaciones ?? cajaDelDia.observaciones ?? null,
      }
      if (montoInicialNum !== null) patch.monto_inicial = montoInicialNum

      const { data: reabierta, error: errReopen } = await supabase
        .from("cajas")
        .update(patch)
        .eq("id", cajaDelDia.id)
        .select("*")
        .single()

      if (errReopen) return res.status(500).json({ error: errReopen.message })
      return res.json(reabierta)
    }

    // 3) No hay ABIERTA ni caja del día -> crear nueva (requiere monto inicial)
    if (montoInicialNum === null) {
      return res.status(400).json({ error: "monto_inicial es obligatorio para abrir caja" })
    }

    const payload = {
      fecha_apertura: new Date().toISOString(),
      estado: "ABIERTA",
      usuario_apertura_id: usuarioId,
      monto_inicial: montoInicialNum,
      observaciones,
    }

    const { data: nueva, error: errCreate } = await supabase
      .from("cajas")
      .insert(payload)
      .select("*")
      .single()

    // Si chocó con el índice por carrera, re-fetch y devolver la existente
    if (errCreate) {
      if (isUniqueCajaAbiertaError(errCreate)) {
        const existente = await getCajaAbierta()
        if (!existente) return res.status(409).json({ error: "Caja abierta ya existe, reintenta." })

        const ownerId =
          existente.usuario_apertura_id !== null && existente.usuario_apertura_id !== undefined
            ? Number(existente.usuario_apertura_id)
            : null

        if (ownerId === usuarioId) {
          if (montoInicialNum !== null) {
            const { data: upd, error: errUpd } = await supabase
              .from("cajas")
              .update({
                monto_inicial: montoInicialNum,
                observaciones: observaciones ?? existente.observaciones ?? null,
              })
              .eq("id", existente.id)
              .select("*")
              .single()

            if (errUpd) return res.status(500).json({ error: errUpd.message })
            return res.json(upd)
          }
          return res.json(existente)
        }

        return res.json(maskCajaForUser(existente, usuarioId))
      }

      return res.status(500).json({ error: errCreate.message })
    }

    return res.json(nueva)
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error abriendo caja" })
  }
})

// ---------------------------------------------------------
// POST /barriles/asignar
// (igual que antes, lo dejo por compat; si no lo usas, no afecta)
// ---------------------------------------------------------
router.post("/barriles/asignar", async (req, res) => {
  try {
    const { barril_ids = [], usuario_id = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null
    const ids = (Array.isArray(barril_ids) ? barril_ids : []).map((x) => Number(x)).filter(Boolean)

    if (!ids.length) return res.status(400).json({ error: "barril_ids vacío." })

    const caja = await getCajaAbierta()
    if (!caja?.id) return res.status(400).json({ error: "No hay caja ABIERTA." })

    const now = new Date().toISOString()

    for (const barrilId of ids) {
      const { data: existente, error: errSel } = await supabase
        .from("caja_barriles")
        .select("id")
        .eq("caja_id", caja.id)
        .eq("barril_id", barrilId)
        .maybeSingle()

      if (errSel) return res.status(500).json({ error: errSel.message })

      if (existente?.id) {
        const { error: errUpd } = await supabase
          .from("caja_barriles")
          .update({
            estado: "EN_USO",
            fecha_asignacion: now,
            fecha_liberacion: null,
            usuario_id: usuarioId,
          })
          .eq("id", existente.id)

        if (errUpd) return res.status(500).json({ error: errUpd.message })
      } else {
        const { error: errIns } = await supabase.from("caja_barriles").insert({
          caja_id: caja.id,
          barril_id: barrilId,
          estado: "EN_USO",
          fecha_asignacion: now,
          fecha_liberacion: null,
          usuario_id: usuarioId,
        })

        if (errIns) return res.status(500).json({ error: errIns.message })
      }
    }

    const { error: errBarriles } = await supabase.from("barriles").update({ estado_actual: "EN_USO" }).in("id", ids)
    if (errBarriles) return res.status(500).json({ error: errBarriles.message })

    await insertMovimientos("ASIGNACION_CAJA", usuarioId, ids, { observaciones: `Asignado a caja #${caja.id}` })

    return res.json({ ok: true, caja_id: caja.id, asignados: ids.length })
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error asignando barriles" })
  }
})

// ---------------------------------------------------------
// POST /cerrar
// ---------------------------------------------------------
router.post("/cerrar", async (req, res) => {
  try {
    const { usuario_id = null, monto_final = null, observaciones = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null

    const caja = await getCajaAbierta()
    if (!caja?.id) return res.status(400).json({ error: "No hay caja ABIERTA para cerrar." })

    const resumen = await buildResumenCaja(caja.id)

    const now = new Date().toISOString()
    const montoInicial = Number(caja.monto_inicial || 0)
    const montoFinalCalculado = montoInicial + Number(resumen.total_neto || 0)

    const payloadClose = {
      estado: "CERRADA",
      fecha_cierre: now,
      usuario_cierre_id: usuarioId,
      observaciones: observaciones ?? caja.observaciones ?? null,
      monto_final:
        monto_final !== null && monto_final !== undefined && monto_final !== ""
          ? Number(monto_final)
          : montoFinalCalculado,
    }

    const { data: cerrada, error: errClose } = await supabase
      .from("cajas")
      .update(payloadClose)
      .eq("id", caja.id)
      .select("*")
      .single()

    if (errClose) return res.status(500).json({ error: errClose.message })

    const resumenFinal = await buildResumenCaja(caja.id)

    return res.json({
      caja: cerrada,
      resumen: {
        ...resumenFinal,
        monto_final_calculado: montoFinalCalculado,
      },
    })
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error cerrando caja" })
  }
})

export default router
