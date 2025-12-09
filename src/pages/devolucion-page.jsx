"use client"

import { useState } from "react"
import DevolucionModal from "../components/modales/devolucion-modal"

const mockDevoluciones = [
  {
    id: 1,
    numeroRecibo: "8432",
    barril: "Pilsner Premium",
    cantidad: 2,
    motivo: "Producto defectuoso",
    fecha: "2024-01-15",
    monto: 90000,
    estado: "Completada",
  },
  {
    id: 2,
    numeroRecibo: "8431",
    barril: "IPA Fuerte",
    cantidad: 1,
    motivo: "Cliente no satisfecho",
    fecha: "2024-01-14",
    monto: 50000,
    estado: "Completada",
  },
  {
    id: 3,
    numeroRecibo: "8430",
    barril: "Stout Oscura",
    cantidad: 1,
    motivo: "Vencimiento próximo",
    fecha: "2024-01-13",
    monto: 52000,
    estado: "Pendiente",
  },
]

const motivosDevoluciones = [
  "Producto defectuoso",
  "Cliente no satisfecho",
  "Vencimiento próximo",
  "Error en pedido",
  "Calidad inferior",
  "Daño en transporte",
]

export default function DevolucionPage() {
  const [devoluciones, setDevoluciones] = useState(mockDevoluciones)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    numeroRecibo: "",
    barril: "",
    cantidad: 1,
    motivo: "",
    monto: 0,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]:
        name === "cantidad"
          ? Number.parseInt(value) || 1
          : name === "monto"
          ? Number.parseInt(value) || 0
          : value,
    })
  }

  const handleCrearDevolucion = () => {
    if (!formData.numeroRecibo || !formData.barril || !formData.motivo || formData.monto === 0) {
      alert("Por favor completa todos los campos")
      return
    }

    const nuevaDevolucion = {
      id: Math.max(...devoluciones.map((d) => d.id), 0) + 1,
      ...formData,
      fecha: new Date().toISOString().split("T")[0],
      estado: "Completada",
    }

    setDevoluciones([nuevaDevolucion, ...devoluciones])
    setFormData({
      numeroRecibo: "",
      barril: "",
      cantidad: 1,
      motivo: "",
      monto: 0,
    })
    setShowModal(false)
    alert("Devolución registrada exitosamente")
  }

  const totalDevuelto = devoluciones
    .filter((d) => d.estado === "Completada")
    .reduce((sum, d) => sum + d.monto, 0)

  const devolucionesPendientes = devoluciones.filter((d) => d.estado === "Pendiente").length

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          ↩️ Devoluciones
        </h1>
        <p className="text-foreground/70 mt-2">
          Gestiona el registro de devoluciones de productos
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-foreground/70">Total Devuelto</p>
              <p className="text-2xl font-bold text-sidebar-primary">
                ${totalDevuelto.toLocaleString()}
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-foreground/70">Devoluciones Registradas</p>
              <p className="text-2xl font-bold text-foreground">
                {devoluciones.length}
              </p>
            </div>
            <span className="text-3xl">📦</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-foreground/70">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-500">
                {devolucionesPendientes}
              </p>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </div>
      </div>

      {/* Botón para nueva devolución */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold flex items-center gap-2"
        >
          ➕ Nueva Devolución
        </button>
      </div>

      {/* Tabla de devoluciones */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Barril
                </th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Monto
                </th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devoluciones.map((devolucion) => (
                <tr
                  key={devolucion.id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-6 py-4 text-foreground font-medium">
                    #{devolucion.numeroRecibo}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {devolucion.barril}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {devolucion.cantidad}
                  </td>
                  <td className="px-6 py-4 text-foreground/70 text-sm">
                    {devolucion.motivo}
                  </td>
                  <td className="px-6 py-4 text-foreground/70 text-sm">
                    {devolucion.fecha}
                  </td>
                  <td className="px-6 py-4 text-sidebar-primary font-semibold">
                    ${devolucion.monto.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        devolucion.estado === "Completada"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {devolucion.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Devolución */}
      <DevolucionModal
        show={showModal}
        formData={formData}
        motivosDevoluciones={motivosDevoluciones}
        onInputChange={handleInputChange}
        onClose={() => setShowModal(false)}
        onSave={handleCrearDevolucion}
      />
    </div>
  )
}
