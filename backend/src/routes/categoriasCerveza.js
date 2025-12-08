// src/routes/categoriasCerveza.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// =====================
// GET /api/categorias-cerveza
// =====================
// Lista categorías activas
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("categorias_cerveza")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("❌ Error Supabase en GET categorias_cerveza:", error)
      return res.status(500).json({
        error: "Error al obtener categorías de cerveza",
        details: error.message,
      })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET categorias_cerveza:", err)
    next(err)
  }
})

// =====================
// GET /api/categorias-cerveza/:id
// =====================
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de categoría inválido" })
    }

    const { data, error } = await supabase
      .from("categorias_cerveza")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("❌ Error Supabase en GET categoria_cerveza por id:", error)
      return res.status(500).json({
        error: "Error al obtener la categoría de cerveza",
        details: error.message,
      })
    }

    if (!data) {
      return res.status(404).json({ error: "Categoría no encontrada" })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET categoria_cerveza por id:", err)
    next(err)
  }
})

// =====================
// POST /api/categorias-cerveza
// =====================
// Crea nueva categoría
router.post("/", async (req, res, next) => {
  try {
    const { nombre, estilo, descripcion } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "nombre es requerido" })
    }

    const { data, error } = await supabase
      .from("categorias_cerveza")
      .insert([
        {
          nombre,
          estilo: estilo || null,
          descripcion: descripcion || null,
          activo: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error Supabase al crear categoria_cerveza:", error)
      return res.status(500).json({
        error: "Error al crear la categoría de cerveza",
        details: error.message,
      })
    }

    res.status(201).json(data)
  } catch (err) {
    console.error("❌ Error inesperado en POST categoria_cerveza:", err)
    next(err)
  }
})

// =====================
// PUT /api/categorias-cerveza/:id
// =====================
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de categoría inválido" })
    }

    const { nombre, estilo, descripcion, activo } = req.body

    const updatePayload = {}
    if (nombre !== undefined) updatePayload.nombre = nombre
    if (estilo !== undefined) updatePayload.estilo = estilo
    if (descripcion !== undefined) updatePayload.descripcion = descripcion
    if (activo !== undefined) updatePayload.activo = activo

    const { data, error } = await supabase
      .from("categorias_cerveza")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error Supabase al actualizar categoria_cerveza:", error)
      return res.status(500).json({
        error: "Error al actualizar la categoría de cerveza",
        details: error.message,
      })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en PUT categoria_cerveza:", err)
    next(err)
  }
})

// =====================
// DELETE (soft) /api/categorias-cerveza/:id
// =====================
// En lugar de borrar, marcamos activo = false
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de categoría inválido" })
    }

    const { error } = await supabase
      .from("categorias_cerveza")
      .update({ activo: false })
      .eq("id", id)

    if (error) {
      console.error("❌ Error Supabase al desactivar categoria_cerveza:", error)
      return res.status(500).json({
        error: "Error al desactivar la categoría de cerveza",
        details: error.message,
      })
    }

    res.status(204).send()
  } catch (err) {
    console.error("❌ Error inesperado en DELETE categoria_cerveza:", err)
    next(err)
  }
})

export default router
