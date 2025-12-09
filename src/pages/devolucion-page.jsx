"use client"

import { useEffect, useState } from "react"
import DevolucionModal from "../components/modales/devolucion-modal"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

const motivosDevoluciones = [
  "Producto defectuoso",
  "Cliente no satisfecho",
  "Vencimiento próximo",
  "Error en pedido",
  "Calidad inferior",
  "Daño en transporte",
]

export default function DevolucionPage() {
  const [devoluciones, setDevoluciones] = useState([])
  const [showModal, setShowModal] = useState(false)

  const cargarDevoluciones = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/devoluciones`)
      if (!res.ok) {
        console.error("Error HTTP al cargar devoluciones", await res.text())
        return
      }
      const data = await res.json()
      setDevoluciones(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("❌ Error cargando devoluciones:", err)
    }
  }

  useEffect(() => {
    cargarDevoluciones()
  }, [])

  const totalDevuelto = devoluciones
    .filter((d) => d.estado !== "ANULADA")
    .reduce((sum, d) => sum + (Number(d.monto_total) || 0), 0)

  const devolucionesPendientes = devoluciones.filter(
    (d) => d.estado === "REGISTRADA"
  ).length

  const handleDevolucionCreada = () => {
    // Re-carga la lista desde el backend para mantener todo consistente
    cargarDevoluciones()
    setShowModal(false)
  }

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
              <p className="text-sm text-foreground/70">
                Devoluciones Registradas
              </p>
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
                  Detalle
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
              {devoluciones.map((devolucion) => {
                const items = devolucion.devolucion_detalle || []
                const itemsCount = items.length
                const cantidadTotal = items.reduce(
                  (sum, it) => sum + (Number(it.cantidad) || 0),
                  0
                )
                const fecha = devolucion.fecha_hora
                  ? new Date(devolucion.fecha_hora).toLocaleDateString("es-CL")
                  : "-"
                const numeroRecibo =
                  devolucion.ventas?.numero_documento ||
                  devolucion.numero_documento ||
                  devolucion.numeroRecibo ||
                  "-"
                const monto = Number(devolucion.monto_total) || 0
                const estadoTexto = devolucion.estado || "REGISTRADA"
                const esCompletada =
                  estadoTexto === "PROCESADA" || estadoTexto === "REGISTRADA"

                return (
                  <tr
                    key={devolucion.id}
                    className="hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground font-medium">
                      #{numeroRecibo}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {itemsCount === 0
                        ? "Sin detalle"
                        : itemsCount === 1
                        ? "1 ítem"
                        : `${itemsCount} ítems`}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {cantidadTotal}
                    </td>
                    <td className="px-6 py-4 text-foreground/70 text-sm">
                      {devolucion.motivo || "—"}
                    </td>
                    <td className="px-6 py-4 text-foreground/70 text-sm">
                      {fecha}
                    </td>
                    <td className="px-6 py-4 text-sidebar-primary font-semibold">
                      ${monto.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          esCompletada
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {estadoTexto}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Devolución */}
      <DevolucionModal
        show={showModal}
        motivosDevoluciones={motivosDevoluciones}
        onClose={() => setShowModal(false)}
        onCreated={handleDevolucionCreada}
      />
    </div>
  )
}
