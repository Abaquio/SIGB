import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
async function buildResumenCaja(cajaId) {
  const { data: ventas, error: errVentas } = await supabase
    .from("ventas")
    .select("id,total_bruto,descuento_total,total_neto,metodo_pago,estado")
    .eq("caja_id", cajaId)
    .neq("estado", "ANULADA")

  if (errVentas) throw new Error(errVentas.message)

  const resumen = {
    caja_id: cajaId,
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

    if (!resumen.por_metodo[metodo]) {
      resumen.por_metodo[metodo] = { ventas: 0, total_neto: 0 }
    }
    resumen.por_metodo[metodo].ventas += 1
    resumen.por_metodo[metodo].total_neto += neto
  }

  const { data: cbActivos, error: errCb } = await supabase
    .from("caja_barriles")
    .select("barril_id")
    .eq("caja_id", cajaId)
    .eq("estado", "EN_USO")

  if (errCb) throw new Error(errCb.message)

  resumen.barriles_en_uso = (cbActivos || []).length
  return resumen
}

async function getCajaAbierta() {
  const { data: caja, error } = await supabase
    .from("cajas")
    .select("*")
    .eq("estado", "ABIERTA")
    .order("fecha_apertura", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return caja || null
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
// GET /actual
// - Prioriza caja ABIERTA
// - Si no hay ABIERTA, devuelve la última caja de HOY
// ---------------------------------------------------------
router.get("/actual", async (req, res) => {
  try {
    const usuarioId = req.query?.usuario_id ? Number(req.query.usuario_id) : null

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    let q = supabase
      .from("cajas")
      .select("*")
      .eq("estado", "ABIERTA")
      .order("fecha_apertura", { ascending: false })
      .limit(1)

    if (usuarioId) q = q.eq("usuario_apertura_id", usuarioId)

    const { data: abierta, error: errAbierta } = await q.maybeSingle()
    if (errAbierta) return res.status(500).json({ error: errAbierta.message })
    if (abierta) return res.json(abierta)

    let q2 = supabase
      .from("cajas")
      .select("*")
      .gte("fecha_apertura", start.toISOString())
      .lt("fecha_apertura", end.toISOString())
      .order("fecha_apertura", { ascending: false })
      .limit(1)

    if (usuarioId) q2 = q2.eq("usuario_apertura_id", usuarioId)

    const { data: hoy, error: errHoy } = await q2.maybeSingle()
    if (errHoy) return res.status(500).json({ error: errHoy.message })

    return res.json(hoy || null)
  } catch (e) {
    return res.status(500).json({ error: "Error obteniendo caja actual" })
  }
})

// ---------------------------------------------------------
// GET /resumen
// ---------------------------------------------------------
router.get("/resumen", async (req, res) => {
  try {
    const cajaId = req.query?.caja_id ? Number(req.query.caja_id) : null
    if (!cajaId) return res.json(null)

    const resumen = await buildResumenCaja(cajaId)
    return res.json(resumen)
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error obteniendo resumen" })
  }
})

// ---------------------------------------------------------
// POST /abrir
// ---------------------------------------------------------
router.post("/abrir", async (req, res) => {
  try {
    const { usuario_id = null, monto_inicial = 0, observaciones = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const { data: abierta, error: errAbierta } = await supabase
      .from("cajas")
      .select("*")
      .eq("estado", "ABIERTA")
      .order("fecha_apertura", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errAbierta) return res.status(500).json({ error: errAbierta.message })

    if (abierta?.id) {
      if (!usuarioId || abierta.usuario_apertura_id === usuarioId) return res.json(abierta)
      return res.status(409).json({ error: "Ya existe una caja ABIERTA por otro usuario." })
    }

    if (usuarioId) {
      const { data: hoy, error: errHoy } = await supabase
        .from("cajas")
        .select("*")
        .eq("usuario_apertura_id", usuarioId)
        .gte("fecha_apertura", start.toISOString())
        .lt("fecha_apertura", end.toISOString())
        .order("fecha_apertura", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (errHoy) return res.status(500).json({ error: errHoy.message })

      if (hoy?.id) {
        const { data: reabierta, error: errReopen } = await supabase
          .from("cajas")
          .update({
            estado: "ABIERTA",
            fecha_cierre: null,
            usuario_cierre_id: null,
            monto_final: null,
            observaciones: observaciones ?? hoy.observaciones ?? null,
          })
          .eq("id", hoy.id)
          .select("*")
          .single()

        if (errReopen) return res.status(500).json({ error: errReopen.message })
        return res.json(reabierta)
      }
    }

    const payload = {
      fecha_apertura: new Date().toISOString(),
      estado: "ABIERTA",
      usuario_apertura_id: usuarioId,
      monto_inicial: Number(monto_inicial) || 0,
      observaciones,
    }

    const { data: nueva, error: errCreate } = await supabase
      .from("cajas")
      .insert(payload)
      .select("*")
      .single()

    if (errCreate) return res.status(500).json({ error: errCreate.message })
    return res.json(nueva)
  } catch (e) {
    return res.status(500).json({ error: "Error abriendo caja" })
  }
})

// ---------------------------------------------------------
// POST /barriles/asignar
// ✅ SIN upsert / SIN ON CONFLICT (compatible con tu BD actual)
// body: { barril_ids: [], usuario_id }
// ---------------------------------------------------------
router.post("/barriles/asignar", async (req, res) => {
  try {
    const { barril_ids = [], usuario_id = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null
    const ids = (Array.isArray(barril_ids) ? barril_ids : [])
      .map((x) => Number(x))
      .filter(Boolean)

    if (!ids.length) return res.status(400).json({ error: "barril_ids vacío." })

    const caja = await getCajaAbierta()
    if (!caja?.id) return res.status(400).json({ error: "No hay caja ABIERTA." })

    const now = new Date().toISOString()

    // 1) INSERT/UPDATE manual
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

    // 2) marcar barriles EN_USO
    const { error: errBarriles } = await supabase
      .from("barriles")
      .update({ estado_actual: "EN_USO" })
      .in("id", ids)

    if (errBarriles) return res.status(500).json({ error: errBarriles.message })

    // 3) movimientos ✔
    await insertMovimientos("ASIGNACION_CAJA", usuarioId, ids, {
      observaciones: `Asignado a caja #${caja.id}`,
    })

    return res.json({ ok: true, caja_id: caja.id, asignados: ids.length })
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error asignando barriles" })
  }
})

// ---------------------------------------------------------
// POST /barriles/liberar
// body: { barril_ids: [], usuario_id }
// ---------------------------------------------------------
router.post("/barriles/liberar", async (req, res) => {
  try {
    const { barril_ids = [], usuario_id = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null
    const ids = (Array.isArray(barril_ids) ? barril_ids : [])
      .map((x) => Number(x))
      .filter(Boolean)

    if (!ids.length) return res.status(400).json({ error: "barril_ids vacío." })

    const caja = await getCajaAbierta()
    if (!caja?.id) return res.status(400).json({ error: "No hay caja ABIERTA." })

    const now = new Date().toISOString()

    const { error: errRel } = await supabase
      .from("caja_barriles")
      .update({ estado: "LIBERADO", fecha_liberacion: now, usuario_id: usuarioId })
      .eq("caja_id", caja.id)
      .in("barril_id", ids)

    if (errRel) return res.status(500).json({ error: errRel.message })

    const { error: errBarriles } = await supabase
      .from("barriles")
      .update({ estado_actual: "DISPONIBLE" })
      .in("id", ids)

    if (errBarriles) return res.status(500).json({ error: errBarriles.message })

    await insertMovimientos("LIBERACION_CAJA", usuarioId, ids, {
      observaciones: `Liberado desde caja #${caja.id}`,
    })

    return res.json({ ok: true, caja_id: caja.id, liberados: ids.length })
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error liberando barriles" })
  }
})

// ---------------------------------------------------------
// POST /cerrar
// ✅ FIX: si caja_barriles está vacío, libera por fallback con barriles.estado_actual = EN_USO
// ---------------------------------------------------------
router.post("/cerrar", async (req, res) => {
  try {
    const { usuario_id = null, monto_final = null, observaciones = null } = req.body || {}
    const usuarioId = usuario_id ? Number(usuario_id) : null

    const caja = await getCajaAbierta()
    if (!caja?.id) return res.status(400).json({ error: "No hay caja ABIERTA para cerrar." })

    const resumen = await buildResumenCaja(caja.id)

    const { data: cb, error: errCb } = await supabase
      .from("caja_barriles")
      .select("barril_id")
      .eq("caja_id", caja.id)
      .eq("estado", "EN_USO")

    if (errCb) return res.status(500).json({ error: errCb.message })

    let barrilIds = (cb || []).map((x) => x.barril_id).filter(Boolean)

    // fallback si no hay registros en caja_barriles
    if (!barrilIds.length) {
      const { data: enUso, error: errEnUso } = await supabase
        .from("barriles")
        .select("id")
        .eq("estado_actual", "EN_USO")

      if (errEnUso) return res.status(500).json({ error: errEnUso.message })
      barrilIds = (enUso || []).map((b) => b.id).filter(Boolean)
    }

    const now = new Date().toISOString()

    if (barrilIds.length) {
      await supabase
        .from("caja_barriles")
        .update({ estado: "LIBERADO", fecha_liberacion: now, usuario_id: usuarioId })
        .eq("caja_id", caja.id)
        .eq("estado", "EN_USO")

      const { error: errUpdBarriles } = await supabase
        .from("barriles")
        .update({ estado_actual: "DISPONIBLE" })
        .in("id", barrilIds)

      if (errUpdBarriles) return res.status(500).json({ error: errUpdBarriles.message })

      await insertMovimientos("LIBERACION_CAJA_CIERRE", usuarioId, barrilIds, {
        observaciones: `Liberación automática por cierre caja #${caja.id}`,
      })
    }

    const payloadClose = {
      estado: "CERRADA",
      fecha_cierre: now,
      usuario_cierre_id: usuarioId,
      observaciones: observaciones ?? caja.observaciones ?? null,
    }

    if (monto_final !== null && monto_final !== undefined && monto_final !== "") {
      payloadClose.monto_final = Number(monto_final)
    }

    const { data: cerrada, error: errClose } = await supabase
      .from("cajas")
      .update(payloadClose)
      .eq("id", caja.id)
      .select("*")
      .single()

    if (errClose) return res.status(500).json({ error: errClose.message })

    return res.json({
      caja: cerrada,
      resumen: {
        ...resumen,
        barriles_liberados: barrilIds.length,
      },
    })
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error cerrando caja" })
  }
})

export default router
