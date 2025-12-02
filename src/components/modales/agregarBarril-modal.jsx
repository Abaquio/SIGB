"use client"

import { useEffect, useState } from "react"
import QRCode from "react-qr-code"

const EMPTY_FORM = {
  // ⚠️ Códigos NO se editan en el front, solo campos de negocio
  tipo_cerveza: "",
  capacidad_litros: 50,
  estado_actual: "DISPONIBLE",
  ubicacion_actual: "",
}

export default function AgregarBarrilModal({
  isOpen,
  onClose,
  mode = "create",        // "create" | "edit"
  initialBarril = null,   // barril a editar
  onSubmit,               // función que recibe formData
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
        // solo para mostrar en el modal (readonly)
        codigo_interno: initialBarril.codigo_interno,
        codigo_qr: initialBarril.codigo_qr,
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, isEdit, initialBarril])

  const handleChange = (e) => {
    const { name, value } = e.target

    // 👉 Solo letras (con acentos) y espacios para tipo_cerveza
    if (name === "tipo_cerveza") {
      const soloLetras = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "")
      setFormData((prev) => ({
        ...prev,
        tipo_cerveza: soloLetras,
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacidad_litros" ? Number(value) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!onSubmit) return

    const payload = { ...formData }

    // no queremos que el front intente cambiar códigos
    delete payload.codigo_interno
    delete payload.codigo_qr

    onSubmit(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      {/* Modal más grande */}
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl animate-in zoom-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-accent">
            {isEdit ? "Editar Barril" : "Agregar Nuevo Barril"}
          </h2>
          <button onClick={onClose} className="text-foreground hover:text-accent text-2xl">
            ×
          </button>
        </div>

        {/* En EDITAR mostramos códigos + QR como info */}
        {isEdit && formData.codigo_qr && (
          <div className="mb-5 flex items-center gap-4">
            <div className="bg-background p-3 rounded-lg border border-border">
              <QRCode value={formData.codigo_qr} size={96} />
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Código QR asignado:</p>
              <p className="font-mono text-foreground break-all">{formData.codigo_qr}</p>

              {formData.codigo_interno && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Código interno:{" "}
                  <span className="font-mono text-foreground">{formData.codigo_interno}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo cerveza */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Tipo de Cerveza
            </label>
            <input
              type="text"
              name="tipo_cerveza"
              value={formData.tipo_cerveza}
              onChange={handleChange}
              placeholder="IPA, Stout..."
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
              required
            />
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
              placeholder="Bodega, Cámara 2..."
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
            />
          </div>

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
