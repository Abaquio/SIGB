// src/routes/movimientos.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// Normaliza el movimiento para el front (SEGURA)
function mapMovimiento(row) {
  return {
    id: row.id,
    fecha_hora: row.fecha_hora,
    tipo_movimiento: row.tipo_movimiento,
    observaciones: row.observaciones,

    barril_id: row.barril_id,
    barril_codigo_interno: row.barriles?.codigo_interno || null,

    usuario_id: row.usuario_id,
    usuario_nombre: row.usuarios?.nombre_completo || null,

    ubicacion_origen: row.ubicacion_origen,
    ubicacion_destino: row.ubicacion_destino,
  }
}

// =====================
// GET /api/movimientos
// =====================
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("movimientos")
      .select(`
        id,
        fecha_hora,
        tipo_movimiento,
        observaciones,
        barril_id,
        usuario_id,
        ubicacion_origen,
        ubicacion_destino,
        barriles: barril_id (
          codigo_interno
        ),
        usuarios: usuario_id (
          nombre_completo
        )
      `)
      .order("fecha_hora", { ascending: false })

    if (error) {
      console.error("❌ Error Supabase en GET /api/movimientos:", error)
      return res.status(500).json({
        error: "Error al obtener movimientos desde Supabase",
        details: error.message,
      })
    }

    const normalized = (data || []).map(mapMovimiento)
    res.json(normalized)
  } catch (err) {
    console.error("❌ Error inesperado en GET /api/movimientos:", err)
    next(err)
  }
})

export default router
