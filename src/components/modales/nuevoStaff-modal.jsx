"use client"

import { useState, useEffect } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function NuevoStaffModal({ isOpen, onClose, onAddStaff, roles = [] }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rut: "",
    rol_id: "",
    password: "Totem2025*", // contraseña de prueba
    fechaContratacion: new Date().toISOString().split("T")[0],
  })

  // cuando lleguen roles desde el padre, si no hay rol seleccionado, tomamos el primero
  useEffect(() => {
    if (roles.length > 0 && !formData.rol_id) {
      setFormData((prev) => ({
        ...prev,
        rol_id: roles[0].id,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target

    // NOMBRE: solo letras + espacios
    if (name === "nombre") {
      let v = value

      // Solo letras (incluye tildes y ñ) y espacios
      v = v.normalize("NFD").replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]/g, "")

      // Evitar espacios al inicio mientras escribe
      if (v.startsWith(" ")) {
        v = v.trimStart()
      }

      setFormData((prev) => ({
        ...prev,
        nombre: v,
      }))
      return
    }

    // RUT: solo dígitos, guion y K; máximo 8 dígitos y 1 DV
    if (name === "rut") {
      let v = value.toUpperCase()

      // Solo 0-9, K y -
      v = v.replace(/[^0-9K-]/g, "")

      let [cuerpo, dv] = v.split("-")

      // Solo dígitos en cuerpo, máx 8
      cuerpo = (cuerpo || "").replace(/[^0-9]/g, "").slice(0, 8)

      // DV: solo 1 caracter 0-9 o K
      if (dv !== undefined) {
        dv = dv.replace(/[^0-9K]/g, "").slice(0, 1)
      }

      if (dv !== undefined && dv !== "") {
        v = `${cuerpo}-${dv}`
      } else {
        v = cuerpo
      }

      setFormData((prev) => ({
        ...prev,
        rut: v,
      }))
      return
    }

    // TELÉFONO: siempre con +56 al inicio, el resto lo completa el usuario
    if (name === "telefono") {
      let digits = value.replace(/\D/g, "") // solo números

      // si empieza con 56, quitamos el prefijo para el resto
      if (digits.startsWith("56")) {
        digits = digits.slice(2)
      }

      // máximo 9 dígitos para el resto (ej: 9XXXXXXXX)
      digits = digits.slice(0, 9)

      const display = digits.length > 0 ? `+56 ${digits}` : "+56 "

      setFormData((prev) => ({
        ...prev,
        telefono: display,
      }))
      return
    }

    // password u otros campos simples
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTelefonoFocus = () => {
    setFormData((prev) => {
      if (!prev.telefono || prev.telefono.trim() === "") {
        return { ...prev, telefono: "+56 " }
      }
      return prev
    })
  }

  const handleNombreBlur = () => {
    setFormData((prev) => {
      let nombre = prev.nombre || ""

      // Reemplazar múltiples espacios por uno
      nombre = nombre.replace(/\s+/g, " ")

      // Quitar espacios al principio y al final
      nombre = nombre.trim()

      return { ...prev, nombre }
    })
  }

  const handleRutBlur = () => {
    setFormData((prev) => {
      let rut = (prev.rut || "").toUpperCase()

      rut = rut.replace(/[^0-9K-]/g, "")

      let [cuerpo, dv] = rut.split("-")

      cuerpo = (cuerpo || "").replace(/[^0-9]/g, "").slice(0, 8)

      if (!dv && cuerpo.length > 0) {
        // si escribió sin guion y tiene al menos 2 caracteres, separamos último como DV
        if (cuerpo.length >= 2) {
          const cuerpoSinDv = cuerpo.slice(0, -1)
          const dvSolo = cuerpo.slice(-1)
          rut = `${cuerpoSinDv}-${dvSolo}`
        } else {
          rut = cuerpo
        }
      } else if (dv) {
        dv = dv.replace(/[^0-9K]/g, "").slice(0, 1)
        rut = dv ? `${cuerpo}-${dv}` : cuerpo
      } else {
        rut = cuerpo
      }

      return { ...prev, rut }
    })
  }

  // Calcula DV de un rut chileno (solo el cuerpo numérico)
  const calcularDv = (cuerpo) => {
    let suma = 0
    let multiplicador = 2

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * multiplicador
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
    }

    const resto = suma % 11
    const dvEsperado = 11 - resto

    if (dvEsperado === 11) return "0"
    if (dvEsperado === 10) return "K"
    return String(dvEsperado)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nombreLimpio = (formData.nombre || "").replace(/\s+/g, " ").trim()
    const rutLimpio = (formData.rut || "").toUpperCase().trim()
    const password = (formData.password || "").trim()

    // Validación nombre
    if (!nombreLimpio) {
      alert("Por favor ingresa el nombre.")
      return
    }

    if (!/^[A-Za-zñÑáéíóúÁÉÍÓÚüÜ ]+$/.test(nombreLimpio)) {
      alert("El nombre solo puede contener letras y espacios.")
      return
    }

    // Validación RUT formato 11222333-4
    const rutRegex = /^[0-9]{7,8}-[0-9K]$/
    if (!rutRegex.test(rutLimpio)) {
      alert('El RUT debe tener el formato "11222333-4" (sin puntos, con guion).')
      return
    }

    const [cuerpo, dvIngresado] = rutLimpio.split("-")
    const dvCorrecto = calcularDv(cuerpo)

    if (dvIngresado !== dvCorrecto) {
      alert("El RUT ingresado no es válido (dígito verificador incorrecto).")
      return
    }

    if (!formData.rol_id) {
      alert("Por favor selecciona un rol.")
      return
    }

    if (!password) {
      alert("La contraseña no puede estar vacía.")
      return
    }

    const payload = {
      nombre_completo: nombreLimpio,
      email: formData.email || null,
      rut: rutLimpio,
      rol_id: Number(formData.rol_id),
      password, // el backend la va a hashear
    }

    try {
      const res = await fetch(`${API_URL}/api/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar usuario")
      }

      const rolCodigo = data.rol || ""
      const cargoLabel =
        rolCodigo === "ADMIN"
          ? "administrador"
          : rolCodigo
          ? rolCodigo.toLowerCase()
          : "sin rol"

      const normalizado = {
        id: data.id,
        nombre: data.nombre_completo,
        email: data.email,
        telefono: formData.telefono || "", // solo visual por ahora
        cargo: cargoLabel,
        rolCodigo,
        rut: data.rut,
        fechaContratacion: data.created_at ? data.created_at.slice(0, 10) : "",
        estado: data.activo ? "activo" : "inactivo",
      }

      onAddStaff(normalizado)
      onClose()

      // Reset
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        rut: "",
        rol_id: roles[0]?.id || "",
        password: "Totem2025*",
        fechaContratacion: new Date().toISOString().split("T")[0],
      })
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  const opcionesRoles = roles.length > 0 ? roles : []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg p-6 md:p-8 w-full max-w-lg animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-accent">Nuevo Miembro del Staff</h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleNombreBlur}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-sidebar-primary"
            />
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@brewmaster.cl"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-sidebar-primary"
              />
            </div>
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                onFocus={handleTelefonoFocus}
                placeholder="+56 9 1234 5678"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-sidebar-primary"
              />
              <p className="text-[11px] text-foreground/40 mt-1">
                Se asume formato chileno (+56) y luego el número.
              </p>
            </div>
          </div>

          {/* Rol y RUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Rol
              </label>
              <select
                name="rol_id"
                value={formData.rol_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary"
              >
                {opcionesRoles.length === 0 ? (
                  <option value="">Sin roles disponibles</option>
                ) : (
                  opcionesRoles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                RUT
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                onBlur={handleRutBlur}
                placeholder="11222333-4"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-sidebar-primary"
              />
            </div>
          </div>

          {/* Contraseña temporal */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Contraseña temporal
            </label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-sidebar-primary"
            />
            <p className="text-[11px] text-foreground/40 mt-1">
              Esta contraseña se guardará hasheada en la base de datos. Puedes cambiarla
              después por usuario.
            </p>
          </div>

          {/* Fecha de contratación (solo visual) */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Fecha de Contratación
            </label>
            <input
              type="date"
              name="fechaContratacion"
              value={formData.fechaContratacion}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary"
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col md:flex-row gap-3 mt-6">
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
