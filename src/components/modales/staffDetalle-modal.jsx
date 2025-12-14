"use client"

import { useEffect, useMemo, useState } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function StaffDetalleModal({
  isOpen,
  onClose,
  staff,
  roles = [],
  onUpdated,
}) {
  // ✅ Hooks SIEMPRE arriba
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cargo: "",
    rolCodigo: "",
    rol_id: null,
    rut: "",
    fechaContratacion: "",
    estado: "activo",
  })

  // ✅ Actividad
  const [actividad, setActividad] = useState([])
  const [actLoading, setActLoading] = useState(false)
  const [actError, setActError] = useState("")
  const [verTodo, setVerTodo] = useState(false) // ✅ expand/collapse

  // ---------------------------
  // Sync datos al abrir
  // ---------------------------
  useEffect(() => {
    if (!isOpen || !staff) return

    setFormData({
      nombre: staff.nombre || "",
      email: staff.email || "",
      telefono: staff.telefono || "",
      cargo: staff.cargo || "",
      rolCodigo: staff.rolCodigo || "",
      rol_id: staff.rol_id ?? null,
      rut: staff.rut || "",
      fechaContratacion: staff.fechaContratacion || "",
      estado: staff.estado || "activo",
    })

    setEditMode(false)
  }, [staff, isOpen])

  // ---------------------------
  // Cargar actividad al abrir
  // ---------------------------
  useEffect(() => {
    if (!isOpen || !staff?.id) return

    const load = async () => {
      try {
        setActLoading(true)
        setActError("")
        const res = await fetch(`${API_URL}/api/usuarios/${staff.id}/actividad?limit=50`)
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          setActError(data?.error || "No se pudo cargar la actividad.")
          setActividad([])
          return
        }

        setActividad(Array.isArray(data) ? data : [])
      } catch (e) {
        setActError("No se pudo cargar la actividad.")
        setActividad([])
      } finally {
        setActLoading(false)
      }
    }

    load()
  }, [isOpen, staff?.id])

  // ✅ lista comprimida a 3 por defecto
  const actividadUI = useMemo(() => {
    if (!Array.isArray(actividad)) return []
    return verTodo ? actividad : actividad.slice(0, 3)
  }, [actividad, verTodo])

  // ✅ Recién después de hooks
  if (!isOpen || !staff) return null

  const cargoEmoji = {
    administrador: "👨‍💼",
    ADMIN: "👨‍💼",
    vendedor: "🛍️",
    VENDEDOR: "🛍️",
    bodeguero: "📦",
    OPERARIO: "📦",
    supervisor: "📋",
    SUPERVISOR: "📋",
    asistente: "🤝",
  }

  const badgeForTipo = (tipo, titulo) => {
    const t = String(tipo || "").toUpperCase()
    if (t === "LOGIN") {
      const ok = String(titulo || "").includes("ÉXITO")
      return ok
        ? "bg-green-500/10 border-green-500/30 text-green-300"
        : "bg-red-500/10 border-red-500/30 text-red-300"
    }
    if (t === "MOVIMIENTOS") return "bg-blue-500/10 border-blue-500/30 text-blue-200"
    return "bg-secondary border-border text-foreground/80"
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "telefono") {
      let digits = value.replace(/\D/g, "")
      if (digits.startsWith("56")) digits = digits.slice(2)
      digits = digits.slice(0, 9)
      const display = digits.length > 0 ? `+56 ${digits}` : "+56 "
      setFormData((prev) => ({ ...prev, telefono: display }))
      return
    }

    if (name === "estado") {
      setFormData((prev) => ({ ...prev, estado: value }))
      return
    }

    if (name === "rol_id") {
      setFormData((prev) => ({ ...prev, rol_id: value ? Number(value) : null }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTelefonoFocus = () => {
    setFormData((prev) => {
      if (!prev.telefono || prev.telefono.trim() === "") {
        return { ...prev, telefono: "+56 " }
      }
      return prev
    })
  }

  const toggleCuenta = () => {
    setFormData((prev) => ({
      ...prev,
      estado: prev.estado === "activo" ? "inactivo" : "activo",
    }))
  }

  const handleGuardar = async () => {
    try {
      setSaving(true)

      const payload = {
        nombre_completo: formData.nombre,
        email: formData.email || null,
        rut: staff.rut,
        activo: formData.estado === "activo",
      }

      if (formData.rol_id) payload.rol_id = formData.rol_id

      const res = await fetch(`${API_URL}/api/usuarios/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar usuario")

      const rolCodigo = data.rol || ""
      const cargoLabel =
        rolCodigo === "ADMIN"
          ? "administrador"
          : rolCodigo
          ? rolCodigo.toLowerCase()
          : "sin rol"

      const actualizado = {
        id: data.id,
        nombre: data.nombre_completo,
        email: data.email,
        telefono: formData.telefono || "",
        cargo: cargoLabel,
        rolCodigo,
        rut: data.rut,
        fechaContratacion: data.created_at ? data.created_at.slice(0, 10) : "",
        estado: data.activo ? "activo" : "inactivo",
        rol_id: data.rol_id ?? null,
      }

      onUpdated && onUpdated(actualizado)
      setEditMode(false)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const recargarActividad = async () => {
    try {
      setActLoading(true)
      setActError("")
      const res = await fetch(`${API_URL}/api/usuarios/${staff.id}/actividad?limit=50`)
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setActError(data?.error || "No se pudo cargar la actividad.")
        setActividad([])
        return
      }

      setActividad(Array.isArray(data) ? data : [])
    } catch (e) {
      setActError("No se pudo cargar la actividad.")
      setActividad([])
    } finally {
      setActLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-accent">
              Detalles del usuario
            </h2>
            <p className="text-xs md:text-sm text-foreground/60">
              Visualiza y edita la información del miembro del staff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className="hidden md:inline-flex px-3 py-1.5 rounded-lg border border-border text-xs md:text-sm text-foreground hover:bg-secondary transition-colors"
              type="button"
            >
              {editMode ? "Cancelar edición" : "Editar"}
            </button>
            {editMode && (
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="hidden md:inline-flex px-3 py-1.5 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs md:text-sm hover:opacity-90 disabled:opacity-60 transition-colors"
                type="button"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-2xl leading-none text-foreground hover:text-accent transition-colors"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Columna izquierda */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-2xl font-semibold mb-3">
                  {staff.nombre?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {formData.nombre}
                </h3>
                <p className="text-sm text-foreground/60 capitalize mt-1">
                  {formData.cargo}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-foreground/60">RUT</span>
                  <span className="font-medium text-foreground">
                    {formData.rut || "-"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-foreground/60">Estado</span>
                  <span
                    className={`font-medium ${
                      formData.estado === "activo"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formData.estado.charAt(0).toUpperCase() +
                      formData.estado.slice(1)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-foreground/60">Desde</span>
                  <span className="font-medium text-foreground">
                    {formData.fechaContratacion || "-"}
                  </span>
                </p>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info personal */}
              <div className="bg-card border border-border rounded-xl p-5 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">
                  Información personal
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Nombre</p>
                    {editMode ? (
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-sidebar-primary"
                      />
                    ) : (
                      <p className="font-medium text-foreground">
                        {formData.nombre}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Correo</p>
                    {editMode ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-sidebar-primary"
                      />
                    ) : (
                      <p className="font-medium text-foreground break-all">
                        {formData.email || "-"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Teléfono</p>
                    {editMode ? (
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        onFocus={handleTelefonoFocus}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-sidebar-primary"
                      />
                    ) : (
                      <p className="font-medium text-foreground">
                        {formData.telefono || "-"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Rol</p>
                    {editMode ? (
                      <select
                        name="rol_id"
                        value={formData.rol_id || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-sidebar-primary"
                      >
                        <option value="">Sin rol</option>
                        {roles.map((rol) => (
                          <option key={rol.id} value={rol.id}>
                            {rol.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium text-foreground capitalize flex items-center gap-2">
                        <span>
                          {cargoEmoji[formData.cargo] ||
                            cargoEmoji[formData.rolCodigo] ||
                            "👤"}
                        </span>
                        <span>{formData.cargo}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cuenta */}
              <div className="bg-card border border-border rounded-xl p-5 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">
                  Cuenta
                </h3>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60 text-xs mb-1">
                      Estado de la cuenta
                    </p>

                    {editMode ? (
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-sidebar-primary"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    ) : (
                      <p
                        className={`font-medium ${
                          formData.estado === "activo"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {formData.estado.charAt(0).toUpperCase() +
                          formData.estado.slice(1)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-end">
                    {editMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          const next =
                            formData.estado === "activo" ? "inactivo" : "activo"
                          const ok = window.confirm(
                            next === "inactivo"
                              ? "¿Seguro que quieres INHABILITAR esta cuenta?"
                              : "¿Seguro que quieres HABILITAR esta cuenta?"
                          )
                          if (ok) toggleCuenta()
                        }}
                        className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          formData.estado === "activo"
                            ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/15"
                            : "bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/15"
                        }`}
                      >
                        {formData.estado === "activo"
                          ? "Inhabilitar cuenta"
                          : "Habilitar cuenta"}
                      </button>
                    ) : (
                      <div className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground/60 text-xs">
                        Activa “Editar” para gestionar la cuenta.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ Actividad del sistema (3 + expand) */}
              <div className="bg-card border border-border rounded-xl p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    Actividad en el sistema
                  </h3>
                  <button
                    type="button"
                    onClick={recargarActividad}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                  >
                    Recargar
                  </button>
                </div>

                {actError ? (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                    {actError}
                  </div>
                ) : null}

                {actLoading ? (
                  <p className="text-sm text-foreground/60">Cargando actividad...</p>
                ) : actividadUI.length === 0 ? (
                  <p className="text-sm text-foreground/60">Sin actividad registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {actividadUI.map((ev, idx) => (
                      <div
                        key={`${ev.tipo}-${ev.fecha_hora}-${idx}`}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary border border-border"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] border ${badgeForTipo(
                                ev.tipo,
                                ev.titulo
                              )}`}
                            >
                              {ev.tipo}
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {ev.titulo}
                            </span>
                          </div>

                          {ev.detalle ? (
                            <p className="text-xs text-foreground/70 mt-1 break-words">
                              {ev.detalle}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-foreground/60">
                            {ev.fecha_hora
                              ? new Date(ev.fecha_hora).toLocaleString()
                              : "-"}
                          </p>
                          {ev.ip ? (
                            <p className="text-[11px] text-foreground/40 mt-1">
                              IP: {ev.ip}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ Expand / Collapse */}
                {!actLoading && !actError && Array.isArray(actividad) && actividad.length > 3 && (
                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={() => setVerTodo((v) => !v)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                    >
                      {verTodo ? "Ver menos" : "Ver más"}
                    </button>
                  </div>
                )}
              </div>

              {/* Acciones mobile */}
              <div className="bg-card border border-border rounded-xl p-4 md:hidden">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setEditMode((prev) => !prev)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                    type="button"
                  >
                    {editMode ? "Cancelar edición" : "Editar"}
                  </button>
                  {editMode && (
                    <button
                      onClick={handleGuardar}
                      disabled={saving}
                      className="flex-1 px-3 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs hover:opacity-90 disabled:opacity-60 transition-colors"
                      type="button"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-end gap-2">
          {editMode && (
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-60 transition-colors text-sm font-medium"
              type="button"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition-colors text-sm font-medium"
            type="button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
