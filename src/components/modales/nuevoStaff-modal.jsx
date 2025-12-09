"use client"

import { useState } from "react"

export default function NuevoStaffModal({ isOpen, onClose, onAddStaff }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cargo: "vendedor",
    rut: "",
    fechaContratacion: new Date().toISOString().split("T")[0],
  })

  const cargos = ["administrador", "vendedor", "gerente", "bodeguero", "asistente"]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.nombre && formData.email && formData.rut) {
      onAddStaff(formData)
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        cargo: "vendedor",
        rut: "",
        fechaContratacion: new Date().toISOString().split("T")[0],
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg p-8 w-full max-w-md animate-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-accent">Nuevo Miembro del Staff</h2>
          <button onClick={onClose} className="text-foreground hover:text-accent transition-colors text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Nombre Completo</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">RUT</label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="12345678-9"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan@brewmaster.cl"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Cargo</label>
            <select
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {cargos.map((cargo) => (
                <option key={cargo} value={cargo} className="bg-secondary text-foreground">
                  {cargo.charAt(0).toUpperCase() + cargo.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Fecha de Contratación</label>
            <input
              type="date"
              name="fechaContratacion"
              value={formData.fechaContratacion}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Agregar Staff
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary border border-border text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
