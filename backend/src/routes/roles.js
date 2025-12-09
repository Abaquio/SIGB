// src/routes/roles.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// GET /api/roles  -> lista de roles activos
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("roles")
      .select("id,nombre,descripcion,activo,created_at")
      .eq("activo", true)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error supabase roles:", error)
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (err) {
    console.error("Error GET /api/roles:", err)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

export default router
