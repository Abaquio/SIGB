"use client"

import { useState } from "react"
import NuevoStaffModal from "@/components/modales/nuevoStaff-modal"

export default function StaffPage() {
  const [staff, setStaff] = useState([
    {
      id: 1,
      nombre: "Carlos González",
      email: "carlos@brewmaster.cl",
      telefono: "+56 9 2123 4567",
      cargo: "administrador",
      rut: "15234567-8",
      fechaContratacion: "2023-06-15",
      estado: "activo",
    },
    {
      id: 2,
      nombre: "María López",
      email: "maria@brewmaster.cl",
      telefono: "+56 9 3234 5678",
      cargo: "vendedor",
      rut: "16345678-9",
      fechaContratacion: "2023-09-20",
      estado: "activo",
    },
    {
      id: 3,
      nombre: "Roberto Silva",
      email: "roberto@brewmaster.cl",
      telefono: "+56 9 4345 6789",
      cargo: "bodeguero",
      rut: "17456789-0",
      fechaContratacion: "2024-01-10",
      estado: "activo",
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showDetalles, setShowDetalles] = useState(false)

  const handleAddStaff = (nuevoStaff) => {
    setStaff((prev) => [
      ...prev,
      {
        ...nuevoStaff,
        id: Math.max(...prev.map((s) => s.id), 0) + 1,
        estado: "activo",
      },
    ])
    setIsModalOpen(false)
  }

  const handleEliminar = (id) => {
    setStaff((prev) => prev.filter((s) => s.id !== id))
  }

  const handleVerDetalles = (miembroStaff) => {
    setSelectedStaff(miembroStaff)
    setShowDetalles(true)
  }

  const totalStaff = staff.length
  const staffActivo = staff.filter((s) => s.estado === "activo").length
  const administradores = staff.filter((s) => s.cargo === "administrador").length

  const cargoEmoji = {
    administrador: "👨‍💼",
    vendedor: "🛍️",
    gerente: "📋",
    bodeguero: "📦",
    asistente: "🤝",
  }

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">👥 Staff</h1>
            <p className="text-foreground/60 mt-2">Gestión del equipo de trabajo</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
          >
            <span>+</span> Nuevo Miembro
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-foreground/60 text-sm font-medium">Total Staff</p>
            <p className="text-4xl font-bold text-accent mt-2">{totalStaff}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-foreground/60 text-sm font-medium">Staff Activo</p>
            <p className="text-4xl font-bold text-accent mt-2">{staffActivo}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-foreground/60 text-sm font-medium">Administradores</p>
            <p className="text-4xl font-bold text-accent mt-2">{administradores}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Nombre</th>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Cargo</th>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Email</th>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Teléfono</th>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Contratación</th>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Estado</th>
                <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((miembro) => (
                <tr key={miembro.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{miembro.nombre}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <span>{cargoEmoji[miembro.cargo]}</span>
                      <span className="text-foreground capitalize">{miembro.cargo}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground/80">{miembro.email}</td>
                  <td className="px-6 py-4 text-foreground/80">{miembro.telefono || "-"}</td>
                  <td className="px-6 py-4 text-foreground/80 text-sm">{miembro.fechaContratacion}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        miembro.estado === "activo" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {miembro.estado.charAt(0).toUpperCase() + miembro.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerDetalles(miembro)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground hover:text-accent"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEliminar(miembro.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-foreground hover:text-red-500"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Staff */}
      <NuevoStaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddStaff={handleAddStaff} />

      {/* Modal Ver Detalles */}
      {showDetalles && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-accent">Detalles del Staff</h2>
              <button
                onClick={() => setShowDetalles(false)}
                className="text-foreground hover:text-accent transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-2xl mx-auto">
                  {cargoEmoji[selectedStaff.cargo]}
                </div>
              </div>

              <div>
                <p className="text-foreground/60 text-sm font-medium">Nombre</p>
                <p className="text-foreground font-semibold">{selectedStaff.nombre}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium">RUT</p>
                <p className="text-foreground font-semibold">{selectedStaff.rut}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium">Cargo</p>
                <p className="text-foreground font-semibold capitalize">{selectedStaff.cargo}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium">Email</p>
                <p className="text-foreground font-semibold">{selectedStaff.email}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium">Teléfono</p>
                <p className="text-foreground font-semibold">{selectedStaff.telefono || "-"}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium">Fecha de Contratación</p>
                <p className="text-foreground font-semibold">{selectedStaff.fechaContratacion}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium">Estado</p>
                <p className={`font-semibold ${selectedStaff.estado === "activo" ? "text-green-500" : "text-red-500"}`}>
                  {selectedStaff.estado.charAt(0).toUpperCase() + selectedStaff.estado.slice(1)}
                </p>
              </div>

              <button
                onClick={() => setShowDetalles(false)}
                className="w-full px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium mt-6"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
