// src/routes/bodegas.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"

const router = Router()

// =====================================
// Helpers de auditoría (sin login aún)
// =====================================
function getRequestMeta(req) {
  // Por ahora no hay login -> usuario_id = null
  const usuarioId = null

  const userAgent = req.headers["user-agent"] || null

  const ipHeader = req.headers["x-forwarded-for"]
  const ip =
    (Array.isArray(ipHeader)
      ? ipHeader[0]
      : typeof ipHeader === "string"
      ? ipHeader.split(",")[0]
      : null) || req.socket?.remoteAddress || null

  return { usuarioId, ip, userAgent }
}

async function registrarAuditoria({
  req,
  modulo,
  accion, // 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'
  entidad,
  entidadId,
  datosAntes,
  datosDespues,
}) {
  try {
    const { usuarioId, ip, userAgent } = getRequestMeta(req)

    const { error } = await supabase.from("auditoria").insert([
      {
        usuario_id: usuarioId,
        modulo,
        accion,
        entidad,
        entidad_id: entidadId ?? null,
        datos_antes: datosAntes ?? null,
        datos_despues: datosDespues ?? null,
        ip,
        user_agent: userAgent,
      },
    ])

    if (error) {
      console.error("❌ Error registrando auditoría bodegas:", error)
    }
  } catch (err) {
    console.error("❌ Error inesperado registrando auditoría bodegas:", err)
  }
}

// =====================
// GET /api/bodegas
// =====================
// Lista bodegas (todas o solo activas si ?onlyActive=true)
router.get("/", async (req, res, next) => {
  try {
    const onlyActive = req.query.onlyActive === "true"

    let query = supabase.from("bodegas").select("*")

    if (onlyActive) {
      query = query.eq("activo", true)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error Supabase en GET bodegas:", error)
      return res.status(500).json({
        error: "Error al obtener las bodegas",
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
// Crea una nueva bodega
router.post("/", async (req, res, next) => {
  try {
    const { nombre, tipo, descripcion, direccion } = req.body

    if (!nombre || typeof nombre !== "string") {
      return res.status(400).json({ error: "El nombre de la bodega es requerido" })
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

    // 🔍 AUDITORÍA: CREAR bodega
    await registrarAuditoria({
      req,
      modulo: "bodegas",
      accion: "CREAR",
      entidad: "bodegas",
      entidadId: data.id,
      datosAntes: null,
      datosDespues: data,
    })

    res.status(201).json(data)
  } catch (err) {
    console.error("❌ Error inesperado en POST bodega:", err)
    next(err)
  }
})

// =====================
// PUT /api/bodegas/:id
// =====================
// Actualiza campos de una bodega
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({ error: "ID de bodega inválido" })
    }

    const { nombre, tipo, descripcion, direccion, activo } = req.body

    // 1) Traemos datos_antes para auditoría
    const { data: before, error: beforeError } = await supabase
      .from("bodegas")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (beforeError) {
      console.error(
        "❌ Error Supabase al obtener bodega antes de actualizar:",
        beforeError,
      )
      return res.status(500).json({
        error: "Error al obtener la bodega antes de actualizar",
        details: beforeError.message,
      })
    }

    if (!before) {
      return res.status(404).json({ error: "Bodega no encontrada" })
    }

    // 2) Construimos payload solo con campos enviados
    const updatePayload = {}
    if (nombre !== undefined) updatePayload.nombre = nombre
    if (tipo !== undefined) updatePayload.tipo = tipo
    if (descripcion !== undefined) updatePayload.descripcion = descripcion
    if (direccion !== undefined) updatePayload.direccion = direccion
    if (activo !== undefined) updatePayload.activo = activo

    if (Object.keys(updatePayload).length === 0) {
      return res
        .status(400)
        .json({ error: "No se envió ningún campo para actualizar" })
    }

    // 3) Actualizamos
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

    // 4) AUDITORÍA: ACTUALIZAR bodega
    await registrarAuditoria({
      req,
      modulo: "bodegas",
      accion: "ACTUALIZAR",
      entidad: "bodegas",
      entidadId: id,
      datosAntes: before,
      datosDespues: data,
    })

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

    // 1) Traemos datos_antes
    const { data: before, error: beforeError } = await supabase
      .from("bodegas")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (beforeError) {
      console.error(
        "❌ Error Supabase al obtener bodega antes de desactivar:",
        beforeError,
      )
      return res.status(500).json({
        error: "Error al obtener la bodega antes de desactivar",
        details: beforeError.message,
      })
    }

    if (!before) {
      return res.status(404).json({ error: "Bodega no encontrada" })
    }

    // 2) Soft delete → activo = false
    const { data: after, error } = await supabase
      .from("bodegas")
      .update({ activo: false })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error Supabase al desactivar bodega:", error)
      return res.status(500).json({
        error: "Error al desactivar la bodega",
        details: error.message,
      })
    }

    // 3) AUDITORÍA: ELIMINAR (soft) bodega
    await registrarAuditoria({
      req,
      modulo: "bodegas",
      accion: "ELIMINAR",
      entidad: "bodegas",
      entidadId: id,
      datosAntes: before,
      datosDespues: after,
    })

    res.status(204).send()
  } catch (err) {
    console.error("❌ Error inesperado en DELETE bodega:", err)
    next(err)
  }
})

export default router
