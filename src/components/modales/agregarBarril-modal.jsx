"use client"

import { useEffect, useState } from "react"
import QRCode from "react-qr-code"

const EMPTY_FORM = {
  tipo_cerveza: "",
  capacidad_litros: 50,
  estado_actual: "DISPONIBLE",
  ubicacion_actual: "",
}

// Variedades sugeridas
const BEER_TYPES = [
  "IPA",
  "Lager",
  "Stout",
  "Pilsner",
  "Porter",
  "Trigo",
  "Amber Ale",
  "Pale Ale",
  "Blonde Ale",
  "NEIPA",
]

export default function AgregarBarrilModal({
  isOpen,
  onClose,
  mode = "create",
  initialBarril = null,
  onSubmit,
}) {
  const isEdit = mode === "edit"
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!isOpen) return

    if (isEdit && initialBarril) {
      setFormData({
        id: initialBarril.id,
        tipo_cerveza: initialBarril.tipo_cerveza || "",
        capacidad_litros: Number(initialBarril.capacidad_litros) || 50,
        estado_actual: initialBarril.estado_actual || "DISPONIBLE",
        ubicacion_actual: initialBarril.ubicacion_actual || "",
        codigo_interno: initialBarril.codigo_interno,
        codigo_qr: initialBarril.codigo_qr,
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, isEdit, initialBarril])

  // -------------------------
  // VALIDACIONES DE CAMPOS
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target

    // Solo letras y espacios para tipo_cerveza (aunque ahora viene de un select)
    if (name === "tipo_cerveza") {
      const soloLetras = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "")
      setFormData((prev) => ({
        ...prev,
        tipo_cerveza: soloLetras,
      }))
      return
    }

    // Solo letras, números y espacios para ubicacion_actual
    if (name === "ubicacion_actual") {
      const limpio = value.replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/g, "")
      setFormData((prev) => ({
        ...prev,
        ubicacion_actual: limpio,
      }))
      return
    }

    // Capacidad numérica
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacidad_litros" ? Number(value) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!onSubmit) return

    const payload = { ...formData }

    // los códigos no deben enviarse desde el front
    delete payload.codigo_interno
    delete payload.codigo_qr

    onSubmit(payload)
  }

  if (!isOpen) return null

  // Para soportar tipos antiguos que no estén en la lista, agregamos la opción dinámica
  const hasCustomBeerType =
    formData.tipo_cerveza &&
    !BEER_TYPES.includes(formData.tipo_cerveza)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl animate-in zoom-in">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-accent">
            {isEdit ? "Editar Barril" : "Agregar Nuevo Barril"}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent text-2xl"
          >
            ×
          </button>
        </div>

        {/* QR (solo en editar) */}
        {isEdit && formData.codigo_qr && (
          <div className="mb-5 flex items-center gap-4">
            <div className="bg-background p-3 rounded-lg border border-border">
              <QRCode value={formData.codigo_qr} size={96} />
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Código QR asignado:</p>
              <p className="font-mono text-foreground break-all">
                {formData.codigo_qr}
              </p>

              {formData.codigo_interno && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Código interno:{" "}
                  <span className="font-mono text-foreground">
                    {formData.codigo_interno}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Tipo cerveza (select) */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Tipo de Cerveza
            </label>
            <select
              name="tipo_cerveza"
              value={formData.tipo_cerveza}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
              required
            >
              <option value="">Selecciona un tipo</option>
              {BEER_TYPES.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
              {hasCustomBeerType && (
                <option value={formData.tipo_cerveza}>
                  {formData.tipo_cerveza}
                </option>
              )}
            </select>
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Capacidad (Litros)
            </label>
            <input
              type="number"
              name="capacidad_litros"
              value={formData.capacidad_litros}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
              min={0}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Estado
            </label>
            <select
              name="estado_actual"
              value={formData.estado_actual}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_USO">En uso</option>
              <option value="LIMPIEZA">Limpieza</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </select>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Ubicación
            </label>
            <input
              type="text"
              name="ubicacion_actual"
              value={formData.ubicacion_actual}
              onChange={handleChange}
              placeholder="Bodega 1, Cámara 2..."
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
            />
          </div>

          {/* BOTONES */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90"
            >
              {isEdit ? "Guardar cambios" : "Agregar Barril"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
