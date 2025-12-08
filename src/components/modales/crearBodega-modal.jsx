"use client"

import { useEffect, useState } from "react"

const EMPTY_FORM = {
  nombre: "",
  tipo: "BODEGA",
  descripcion: "",
  direccion: "",
  activo: true,
}

export default function CrearBodegaModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        tipo: initialData.tipo || "BODEGA",
        descripcion: initialData.descripcion || "",
        direccion: initialData.direccion || "",
        activo: initialData.activo ?? true,
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  // ==========================
  // Helpers de sanitización
  // ==========================
  const normalizeSpaces = (str) => str.replace(/\s+/g, " ").trim()

  // Solo letras + espacios (nombre)
  const filterNombreChars = (str) =>
    str.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "")

  // Letras, números, espacios y símbolos básicos (dirección)
  const filterDireccionChars = (str) =>
    str.replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ #.,-]/g, "")

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = value

    if (name === "nombre") {
      // aquí solo filtramos caracteres, NO hacemos trim ni quitamos dobles espacios
      newValue = filterNombreChars(value)
    }

    if (name === "direccion") {
      newValue = filterDireccionChars(value)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      ...formData,
      nombre: normalizeSpaces(filterNombreChars(formData.nombre)),
      direccion: formData.direccion
        ? normalizeSpaces(filterDireccionChars(formData.direccion))
        : "",
    }

    onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg animate-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            {initialData ? "Editar Bodega" : "Nueva Bodega"}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Bodega Principal"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            >
              <option value="BODEGA">Bodega</option>
              <option value="CAMARA">Cámara</option>
              <option value="BAR">Bar</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dirección / Ubicación
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle 123, Bodega Sur..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Notas internas sobre la bodega..."
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary resize-none"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input
              id="activo"
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border text-sidebar-primary focus:ring-sidebar-primary"
            />
            <label htmlFor="activo" className="text-sm text-foreground">
              Bodega activa
            </label>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium"
            >
              {initialData ? "Guardar Cambios" : "Crear Bodega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
