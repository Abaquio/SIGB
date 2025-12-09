// src/routes/usuarios.js
import { Router } from "express"
import { supabase } from "../supabaseClient.js"
import bcrypt from "bcryptjs"

const router = Router()

// GET /api/usuarios  -> lista de usuarios con rol
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre_completo,email,rut,rol,activo,created_at,rol_id,telefono")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error supabase usuarios:", error)
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (err) {
    console.error("Error GET /api/usuarios:", err)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// POST /api/usuarios  -> crea un nuevo usuario con password hasheada
router.post("/", async (req, res) => {
  try {
    const { nombre_completo, email, rut, rol_id, password, telefono } = req.body

    if (!nombre_completo || !rut || !rol_id) {
      return res
        .status(400)
        .json({ error: "Nombre completo, RUT y rol son obligatorios" })
    }

    if (!password) {
      return res.status(400).json({ error: "La contraseña es obligatoria" })
    }

    // 1) Validar que el RUT no esté repetido
    const { data: existingRut, error: rutError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("rut", rut)
      .maybeSingle()

    if (rutError) {
      console.error("Error verificando RUT:", rutError)
      return res.status(500).json({ error: rutError.message })
    }

    if (existingRut) {
      return res
        .status(400)
        .json({ error: "El RUT ya está registrado en el sistema" })
    }

    // 2) Validar que el email no esté repetido (si viene)
    if (email) {
      const { data: existingEmail, error: emailError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (emailError) {
        console.error("Error verificando email:", emailError)
        return res.status(500).json({ error: emailError.message })
      }

      if (existingEmail) {
        return res.status(400).json({
          error: "El correo electrónico ya está registrado en el sistema",
        })
      }
    }

    // 3) buscamos el rol para sincronizar el campo texto "rol"
    const { data: rolRow, error: rolError } = await supabase
      .from("roles")
      .select("id,nombre")
      .eq("id", rol_id)
      .maybeSingle()

    if (rolError) {
      console.error("Error consultando rol:", rolError)
      return res.status(500).json({ error: rolError.message })
    }

    if (!rolRow) {
      return res.status(400).json({ error: "Rol no válido" })
    }

    // 4) Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    const payload = {
      nombre_completo,
      email: email || null,
      rut,
      rol: rolRow.nombre, // ADMIN, OPERARIO, etc.
      rol_id: rolRow.id,
      activo: true,
      password: passwordHash,
      telefono: telefono || null,
    }

    const { data, error } = await supabase
      .from("usuarios")
      .insert([payload])
      .select(
        "id,nombre_completo,email,rut,rol,activo,created_at,rol_id,telefono"
      )
      .single()

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({
          error:
            "Ya existe un usuario con el mismo RUT o correo (restricción única)",
        })
      }

      console.error("Error insertando usuario:", error)
      return res.status(500).json({ error: error.message })
    }

    res.status(201).json(data)
  } catch (err) {
    console.error("Error POST /api/usuarios:", err)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// PUT /api/usuarios/:id  -> actualizar usuario (sin tocar password por ahora)
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { nombre_completo, email, rut, rol_id, activo, telefono } = req.body

    const updates = {
      ...(nombre_completo !== undefined && { nombre_completo }),
      ...(email !== undefined && { email }),
      ...(rut !== undefined && { rut }),
      ...(activo !== undefined && { activo }),
      ...(telefono !== undefined && { telefono }),
    }

    if (rol_id) {
      const { data: rolRow, error: rolError } = await supabase
        .from("roles")
        .select("id,nombre")
        .eq("id", rol_id)
        .maybeSingle()

      if (rolError) {
        console.error("Error consultando rol:", rolError)
        return res.status(500).json({ error: rolError.message })
      }

      if (!rolRow) {
        return res.status(400).json({ error: "Rol no válido" })
      }

      updates.rol_id = rolRow.id
      updates.rol = rolRow.nombre
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update(updates)
      .eq("id", id)
      .select(
        "id,nombre_completo,email,rut,rol,activo,created_at,rol_id,telefono"
      )
      .single()

    if (error) {
      console.error("Error actualizando usuario:", error)
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (err) {
    console.error("Error PUT /api/usuarios/:id:", err)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

export default router
