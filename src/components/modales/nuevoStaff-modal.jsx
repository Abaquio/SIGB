"use client"

import { useState, useEffect, useMemo } from "react"

export default function NuevoStaffModal({ isOpen, onClose, onAddStaff, roles = [] }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rut: "",
    rol_id: "",
    password: "totem123", // contraseña de prueba editable
    fechaContratacion: new Date().toISOString().split("T")[0],
  })

  const [emailTouched, setEmailTouched] = useState(false)

  // ✅ Al abrir el modal, seleccionar primer rol disponible
  useEffect(() => {
    if (isOpen && roles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        rol_id: prev.rol_id || String(roles[0].id),
      }))
    }
  }, [isOpen, roles])

  // ✅ Reset UI states al cerrar
  useEffect(() => {
    if (!isOpen) setEmailTouched(false)
  }, [isOpen])

  // ===============================
  // VALIDACIONES (hooks siempre arriba)
  // ===============================
  const isEmailValido = useMemo(() => {
    const e = (formData.email || "").trim()
    // Requiere: texto@texto.texto (sin espacios) y punto DESPUÉS del @
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return re.test(e)
  }, [formData.email])

  const emailError = useMemo(() => {
    if (!emailTouched) return ""
    if (!formData.email.trim()) return "El correo es obligatorio."
    if (!isEmailValido) return 'Ingresa un correo válido (ej: "correo@ejemplo.cl").'
    return ""
  }, [emailTouched, formData.email, isEmailValido])

  // ✅ Render condicional después de hooks
  if (!isOpen) return null

  // ===============================
  // HANDLERS
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target

    // ✅ Nombre: permitir espacios mientras escribe (sin trim en vivo)
    if (name === "nombre") {
      let v = value
        .normalize("NFD")
        .replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]/g, "")
      setFormData((prev) => ({ ...prev, nombre: v }))
      return
    }

    if (name === "telefono") {
      let v = value.replace(/\D/g, "")
      v = v.slice(0, 9)
      setFormData((prev) => ({ ...prev, telefono: v }))
      return
    }

    if (name === "rut") {
      let input = value.toUpperCase().replace(/[^0-9K-]/g, "")

      const firstDashIndex = input.indexOf("-")

      if (firstDashIndex !== -1) {
        let cuerpo = input
          .slice(0, firstDashIndex)
          .replace(/[^0-9]/g, "")
          .slice(0, 8)

        let dv = input
          .slice(firstDashIndex + 1)
          .replace(/[^0-9K]/g, "")
          .slice(0, 1)

        const rutFormateado = dv ? `${cuerpo}-${dv}` : `${cuerpo}-`
        setFormData((prev) => ({ ...prev, rut: rutFormateado }))
      } else {
        let cuerpo = input.replace(/[^0-9]/g, "").slice(0, 8)
        setFormData((prev) => ({ ...prev, rut: cuerpo }))
      }
      return
    }

    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRutBlur = () => {
    setFormData((prev) => {
      let rut = (prev.rut || "").toUpperCase().replace(/[^0-9K-]/g, "")
      let [cuerpo, dv] = rut.split("-")

      cuerpo = cuerpo?.replace(/[^0-9]/g, "").slice(0, 8) || ""

      if (dv) {
        dv = dv.replace(/[^0-9K]/g, "").slice(0, 1)
        return { ...prev, rut: `${cuerpo}-${dv}` }
      }

      if (cuerpo.length > 1) {
        const cuerpoSinDv = cuerpo.slice(0, -1)
        const dvInferido = cuerpo.slice(-1)
        return { ...prev, rut: `${cuerpoSinDv}-${dvInferido}` }
      }

      return { ...prev, rut: cuerpo }
    })
  }

  const validarRut = (rutCompleto) => {
    if (!rutCompleto) return false
    const regex = /^[0-9]{8}-[0-9K]$/
    return regex.test(rutCompleto.toUpperCase())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ✅ Limpieza del nombre SOLO al guardar (permite espacios al tipear)
    const nombre = formData.nombre.replace(/\s+/g, " ").trim()
    const email = formData.email.trim()
    const rut = formData.rut.trim().toUpperCase()
    const password = formData.password.trim()
    const rol_id = formData.rol_id ? Number(formData.rol_id) : null

    if (!nombre) {
      alert("El nombre es obligatorio.")
      return
    }

    setEmailTouched(true)
    if (!email) {
      alert("El correo es obligatorio.")
      return
    }
    if (!isEmailValido) {
      alert('Ingresa un correo válido (ej: "correo@ejemplo.cl").')
      return
    }

    if (!password) {
      alert("La contraseña es obligatoria.")
      return
    }
    if (!rol_id) {
      alert("Debes seleccionar un rol.")
      return
    }
    if (!validarRut(rut)) {
      alert('El RUT debe tener el formato 8 dígitos + "-" + 1 dígito o K. Ej: 11222333-4')
      return
    }

    let telefonoBonito = null
    if (formData.telefono) {
      const t = formData.telefono
      telefonoBonito = t.length >= 9 ? `+56 ${t[0]} ${t.slice(1, 5)} ${t.slice(5)}` : `+56 ${t}`
    }

    const API = import.meta.env.VITE_API_URL || "http://localhost:4000"

    const payload = {
      nombre_completo: nombre,
      email,
      rut,
      rol_id,
      password,
      telefono: telefonoBonito,
    }

    try {
      const res = await fetch(`${API}/api/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        alert(data?.error || "Error al crear el usuario.")
        return
      }

      onAddStaff?.(data)

      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        rut: "",
        rol_id: roles.length > 0 ? String(roles[0].id) : "",
        password: "totem123",
        fechaContratacion: new Date().toISOString().split("T")[0],
      })

      setEmailTouched(false)
      onClose?.()
    } catch (err) {
      console.error(err)
      alert("Error de conexión al crear el usuario.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl mx-4 p-6 md:p-8 animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-accent">Nuevo Miembro del Staff</h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Nombre completo
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: María Pérez"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              />
            </div>

            {/* RUT */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                RUT
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                onBlur={handleRutBlur}
                placeholder="11222333-4"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setEmailTouched(true)}
                placeholder="correo@ejemplo.cl"
                className={[
                  "w-full px-3 py-2 rounded-lg bg-background border text-sm text-foreground",
                  emailError ? "border-red-500/60 focus:border-red-500" : "border-border",
                ].join(" ")}
              />
              {emailError ? <p className="text-xs text-red-400 mt-1">{emailError}</p> : null}
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Teléfono (+56)
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground/70 select-none">
                  +56
                </span>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="9 1234 5678"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Rol / Cargo
              </label>
              <select
                name="rol_id"
                value={formData.rol_id}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              >
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Fecha de contratación
              </label>
              <input
                type="date"
                name="fechaContratacion"
                value={formData.fechaContratacion}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              />
            </div>

            {/* Contraseña */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">
                Contraseña asignada
              </label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              />
              <p className="text-xs text-foreground/50 mt-1">
                Esta contraseña se enviará al backend para guardarse con hash.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
