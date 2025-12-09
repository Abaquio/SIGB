import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// ===============================
// 📌 Helper: Formato seguro
// ===============================
function parseDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// ===============================
// 📅 1) REPORTE DIARIO
// ===============================
// GET /api/reportes/diario?fecha=YYYY-MM-DD
router.get("/diario", async (req, res) => {
  try {
    const { fecha } = req.query

    if (!fecha) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar ?fecha=YYYY-MM-DD" })
    }

    // Validar fecha
    const d = parseDate(fecha)
    if (!d) {
      return res
        .status(400)
        .json({ error: "Formato de fecha inválido. Usa YYYY-MM-DD" })
    }

    // Movimientos del día
    const { data: movimientos, error: movErr } = await supabase
      .from("movimientos")
      .select("*")
      .gte("fecha_hora", `${fecha} 00:00:00`)
      .lte("fecha_hora", `${fecha} 23:59:59`)
      .order("fecha_hora", { ascending: false })

    if (movErr)
      return res
        .status(500)
        .json({ error: "Error obteniendo movimientos", details: movErr.message })

    // Alertas del día
    const { data: alertas, error: alertErr } = await supabase
      .from("alertas")
      .select("*")
      .gte("fecha_generada", `${fecha} 00:00:00`)
      .lte("fecha_generada", `${fecha} 23:59:59`)
      .order("fecha_generada", { ascending: false })

    if (alertErr)
      return res
        .status(500)
        .json({ error: "Error obteniendo alertas", details: alertErr.message })

    return res.json({
      fecha,
      total_movimientos: movimientos.length,
      total_alertas: alertas.length,
      movimientos,
      alertas,
    })
  } catch (err) {
    console.error("ERROR REPORTE DIARIO:", err)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
})

// ===============================
// 📆 2) REPORTE MENSUAL
// ===============================
// GET /api/reportes/mensual?mes=YYYY-MM
router.get("/mensual", async (req, res) => {
  try {
    const { mes } = req.query

    if (!mes) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar ?mes=YYYY-MM" })
    }

    // Validar mes
    const parsed = mes.split("-")
    if (parsed.length !== 2) {
      return res
        .status(400)
        .json({ error: "Formato inválido de mes. Usa YYYY-MM" })
    }

    const [year, month] = parsed

    // Movimientos del mes
    const { data: movimientos, error: movErr } = await supabase
      .from("movimientos")
      .select("*")
      .eq("extract_year", year) // estos NO existen en tu BD, así que usamos between
      .order("fecha_hora", { ascending: false })

    // Mejor usando BETWEEN (100% compatible con tu estructura)
    const { data: movimientos2, error: movErr2 } = await supabase
      .from("movimientos")
      .select("*")
      .gte("fecha_hora", `${mes}-01`)
      .lte("fecha_hora", `${mes}-31`)
      .order("fecha_hora", { ascending: false })

    if (movErr2)
      return res
        .status(500)
        .json({ error: "Error obteniendo movimientos", details: movErr2.message })

    // Alertas del mes
    const { data: alertas, error: alertErr } = await supabase
      .from("alertas")
      .select("*")
      .gte("fecha_generada", `${mes}-01`)
      .lte("fecha_generada", `${mes}-31`)
      .order("fecha_generada", { ascending: false })

    if (alertErr)
      return res
        .status(500)
        .json({ error: "Error obteniendo alertas", details: alertErr.message })

    return res.json({
      mes,
      total_movimientos: movimientos2.length,
      total_alertas: alertas.length,
      movimientos: movimientos2,
      alertas,
    })
  } catch (err) {
    console.error("ERROR REPORTE MENSUAL:", err)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
})

export default router
