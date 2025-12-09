import { Router } from "express"
import { supabase } from "../supabaseClient.js"
import bcrypt from "bcryptjs"

const router = Router()

router.post("/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "Completa email y contraseña." })
  }

  try {
    // Buscar usuario
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (error || !user) {
      await registrarAuditoria(null, email, "ERROR", "Usuario no encontrado")
      return res.status(401).json({ error: "Credenciales incorrectas." })
    }

    // Comparar contraseña
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      await registrarAuditoria(user.id, email, "ERROR", "Contraseña incorrecta")
      return res.status(401).json({ error: "Credenciales incorrectas." })
    }

    // Auditoría éxito
    await registrarAuditoria(user.id, email, "EXITO", "Inicio de sesión correcto")

    delete user.password
    res.json({ usuario: user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Error al iniciar sesión." })
  }
})

async function registrarAuditoria(usuario_id, email, resultado, detalle) {
  await supabase.from("auditoria_login").insert({
    usuario_id: usuario_id,
    resultado,
    detalle,
    user_agent: "browser",
    ip: "0.0.0.0",
  })
}

export default router
