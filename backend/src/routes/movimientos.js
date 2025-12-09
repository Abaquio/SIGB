// src/routes/movimientos.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// Normaliza el movimiento para el front
function mapMovimiento(row) {
  const barril = row.barriles
  const usuario = row.usuarios

  return {
    ...row,
    barril_codigo_interno: barril?.codigo_interno || null,
    usuario_nombre: usuario?.nombre_completo || null,
  }
}

// =====================
// GET /api/movimientos
// =====================
// Lista de movimientos (por ahora sin filtros, solo ordenados por fecha)
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("movimientos")
      .select("*, barriles(codigo_interno), usuarios(nombre_completo)")
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
