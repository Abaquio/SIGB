"use client"

import { useState, useEffect } from "react"

export default function NuevoStaffModal({ isOpen, onClose, onAddStaff }) {
  const [rolesBD, setRolesBD] = useState([])

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cargo: "",
    rut: "",
    password: "totem123", // contraseña de prueba editable
    fechaContratacion: new Date().toISOString().split("T")[0],
  })

  // ===============================
  // Cargar roles desde la BD
  // ===============================
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || "http://localhost:4000"
        const res = await fetch(`${API}/api/roles`)

        if (!res.ok) {
          console.error("Error HTTP al obtener roles:", res.status, res.statusText)
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()

        // data: [{id, nombre, ...}, ...] o { roles: [...] }
        let rolesArray = []
        if (Array.isArray(data)) {
          rolesArray = data.map((r) => r.nombre).filter(Boolean)
        } else if (data && Array.isArray(data.roles)) {
          rolesArray = data.roles
        }

        if (!rolesArray.length) {
          rolesArray = ["ADMIN", "OPERARIO", "SUPERVISOR", "VENDEDOR"]
        }

        setRolesBD(rolesArray)
        setFormData((prev) => ({
          ...prev,
          cargo: prev.cargo || rolesArray[0] || "",
        }))
      } catch (e) {
        console.error("Error obteniendo roles:", e)
        const fallback = ["ADMIN", "OPERARIO", "SUPERVISOR", "VENDEDOR"]
        setRolesBD(fallback)
        setFormData((prev) => ({
          ...prev,
          cargo: prev.cargo || fallback[0],
        }))
      }
    }

    if (isOpen) fetchRoles()
  }, [isOpen])

  if (!isOpen) return null

  // ===============================
  // VALIDACIONES INPUT
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target

    // Nombre: solo letras y espacios
    if (name === "nombre") {
      let v = value
        .normalize("NFD")
        .replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]/g, "")
      v = v.replace(/\s+/g, " ")
      v = v.replace(/^\s+|\s+$/g, "")
      setFormData((prev) => ({ ...prev, nombre: v }))
      return
    }

    // Teléfono: solo dígitos
    if (name === "telefono") {
      let v = value.replace(/\D/g, "")
      v = v.slice(0, 9)
      setFormData((prev) => ({ ...prev, telefono: v }))
      return
    }

    // RUT mientras escribe (solo formato)
    if (name === "rut") {
      let input = value.toUpperCase().replace(/[^0-9K-]/g, "")

      const firstDashIndex = input.indexOf("-")

      if (firstDashIndex !== -1) {
        // Con guion
        let cuerpo = input
          .slice(0, firstDashIndex)
          .replace(/[^0-9]/g, "")
          .slice(0, 8) // máximo 8 dígitos

        let dv = input
          .slice(firstDashIndex + 1)
          .replace(/[^0-9K]/g, "")
          .slice(0, 1) // solo 1 carácter de DV

        const rutFormateado = dv ? `${cuerpo}-${dv}` : `${cuerpo}-`
        setFormData((prev) => ({ ...prev, rut: rutFormateado }))
      } else {
        // Sin guion todavía
        let cuerpo = input.replace(/[^0-9]/g, "").slice(0, 8)
        setFormData((prev) => ({ ...prev, rut: cuerpo }))
      }

      return
    }

    // Otros campos
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Autoformato RUT al salir del input
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

  // ===============================
  // VALIDACIÓN SIMPLE DE RUT
  // ===============================
  // Solo formato: 8 dígitos + "-" + 1 dígito o K
  const validarRut = (rutCompleto) => {
    if (!rutCompleto) return false
    const regex = /^[0-9]{8}-[0-9K]$/
    return regex.test(rutCompleto.toUpperCase())
  }

  // ===============================
  // SUBMIT
  // ===============================
  const handleSubmit = (e) => {
    e.preventDefault()

    const nombre = formData.nombre.trim()
    const email = formData.email.trim()
    const rut = formData.rut.trim().toUpperCase()
    const password = formData.password.trim()

    if (!nombre) {
      alert("El nombre es obligatorio.")
      return
    }
    if (!email) {
      alert("El correo es obligatorio.")
      return
    }
    if (!password) {
      alert("La contraseña es obligatoria.")
      return
    }

    if (!validarRut(rut)) {
      alert(
        'El RUT debe tener el formato 8 dígitos + "-" + 1 dígito o K. Ej: 11222333-4'
      )
      return
    }

    // Formatear teléfono bonito
    let telefonoBonito = ""
    if (formData.telefono) {
      const t = formData.telefono
      if (t.length >= 9) {
        telefonoBonito = `+56 ${t[0]} ${t.slice(1, 5)} ${t.slice(5)}`
      } else {
        telefonoBonito = `+56 ${t}`
      }
    }

    const newStaff = {
      nombre,
      email,
      telefono: telefonoBonito,
      cargo: formData.cargo,
      rut,
      password, // contraseña editable
      fechaContratacion: formData.fechaContratacion,
    }

    onAddStaff?.(newStaff)

    // Reset
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      cargo: rolesBD[0] || "",
      rut: "",
      password: "totem123",
      fechaContratacion: new Date().toISOString().split("T")[0],
    })
  }

  const telefonoDisplay = formData.telefono

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
                placeholder="correo@ejemplo.cl"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              />
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
                  value={telefonoDisplay}
                  onChange={handleChange}
                  placeholder="9 1234 5678"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
                />
              </div>
            </div>

            {/* Cargo / Rol */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Rol / Cargo
              </label>
              <select
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
              >
                {rolesBD.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de contratación */}
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

            {/* Contraseña editable */}
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
                Puedes modificarla antes de crear el usuario.
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
