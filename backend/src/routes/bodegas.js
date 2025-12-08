// src/routes/bodegas.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// =====================
// GET /api/bodegas
// =====================
// Lista bodegas (todas o solo activas si ?onlyActive=true)
router.get("/", async (req, res, next) => {
  try {
    const onlyActive = req.query.onlyActive === "true"

    let query = supabase
      .from("bodegas")
      .select("*")
      .order("nombre", { ascending: true })

    if (onlyActive) {
      query = query.eq("activo", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error Supabase en GET bodegas:", error)
      return res.status(500).json({
        error: "Error al obtener bodegas",
        details: error.message,
      })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET bodegas:", err)
    next(err)
  }
})

// =====================
// GET /api/bodegas/:id
// =====================
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de bodega inválido" })
    }

    const { data, error } = await supabase
      .from("bodegas")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("❌ Error Supabase en GET bodega por id:", error)
      return res.status(500).json({
        error: "Error al obtener la bodega",
        details: error.message,
      })
    }

    if (!data) {
      return res.status(404).json({ error: "Bodega no encontrada" })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en GET bodega por id:", err)
    next(err)
  }
})

// =====================
// POST /api/bodegas
// =====================
// Crea nueva bodega
router.post("/", async (req, res, next) => {
  try {
    const { nombre, tipo, descripcion, direccion } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "nombre es requerido" })
    }

    const { data, error } = await supabase
      .from("bodegas")
      .insert([
        {
          nombre,
          tipo: tipo || "BODEGA",
          descripcion: descripcion || null,
          direccion: direccion || null,
          activo: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Error Supabase al crear bodega:", error)
      return res.status(500).json({
        error: "Error al crear la bodega",
        details: error.message,
      })
    }

    res.status(201).json(data)
  } catch (err) {
    console.error("❌ Error inesperado en POST bodega:", err)
    next(err)
  }
})

// =====================
// PUT /api/bodegas/:id
// =====================
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de bodega inválido" })
    }

    const { nombre, tipo, descripcion, direccion, activo } = req.body

    const updatePayload = {}
    if (nombre !== undefined) updatePayload.nombre = nombre
    if (tipo !== undefined) updatePayload.tipo = tipo
    if (descripcion !== undefined) updatePayload.descripcion = descripcion
    if (direccion !== undefined) updatePayload.direccion = direccion
    if (activo !== undefined) updatePayload.activo = activo

    const { data, error } = await supabase
      .from("bodegas")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error Supabase al actualizar bodega:", error)
      return res.status(500).json({
        error: "Error al actualizar la bodega",
        details: error.message,
      })
    }

    res.json(data)
  } catch (err) {
    console.error("❌ Error inesperado en PUT bodega:", err)
    next(err)
  }
})

// =====================
// DELETE (soft) /api/bodegas/:id
// =====================
// Marcamos activo = false
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de bodega inválido" })
    }

    const { error } = await supabase
      .from("bodegas")
      .update({ activo: false })
      .eq("id", id)

    if (error) {
      console.error("❌ Error Supabase al desactivar bodega:", error)
      return res.status(500).json({
        error: "Error al desactivar la bodega",
        details: error.message,
      })
    }

    res.status(204).send()
  } catch (err) {
    console.error("❌ Error inesperado en DELETE bodega:", err)
    next(err)
  }
})

export default router
