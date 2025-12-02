"use client"

import { useEffect, useState } from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { BadgeX as Barrel, Plus, Trash2, Edit, Eye } from "lucide-react"
import QRCode from "react-qr-code"

import AgregarBarrilModal from "../components/modales/agregarBarril-modal"
import BarrilVistaFullModal from "../components/modales/barril-vistaFull"
import ConfirmDialog from "../components/ui/confirm"
import ValidadoCard from "../components/ui/validado"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

// Datos demo para el gráfico si no hay barriles
const barrelsDataDemo = [
  { name: "IPA", cantidad: 12, capacidad: 500 },
  { name: "Lager", cantidad: 18, capacidad: 750 },
  { name: "Stout", cantidad: 9, capacidad: 400 },
]

// Construye los puntos del gráfico a partir de los barriles reales
function buildChartData(barrels) {
  if (!barrels || barrels.length === 0) return []

  const map = new Map()

  barrels.forEach((barril) => {
    const tipo = barril.tipo_cerveza || "Sin tipo"
    const capacidad = Number(barril.capacidad_litros) || 0

    if (!map.has(tipo)) {
      map.set(tipo, {
        name: tipo,
        cantidad: 0,
        capacidad: 0,
      })
    }

    const item = map.get(tipo)
    item.cantidad += 1
    item.capacidad += capacidad
  })

  return Array.from(map.values())
}

// Colores para la pill del estado
const getEstadoClasses = (estado) => {
  switch (estado) {
    case "DISPONIBLE":
      return "bg-green-500/20 text-green-400"
    case "LIMPIEZA":
      return "bg-blue-500/20 text-blue-400"
    case "MANTENIMIENTO":
      return "bg-yellow-500/20 text-yellow-400"
    case "EN_USO":
      return "bg-orange-500/20 text-orange-400"
    default:
      return "bg-gray-500/20 text-gray-400"
  }
}

// Para la barra de capacidad: si tiene capacidad > 0, se ve llena (100%)
const getCapacidadPercent = (capacidad) => {
  const cap = Number(capacidad) || 0
  return cap > 0 ? 100 : 0
}

export default function BarrelsPage() {
  const [barrels, setBarrels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("create")
  const [selectedBarrel, setSelectedBarrel] = useState(null)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [barrelToDelete, setBarrelToDelete] = useState(null)

  const [confirmEditOpen, setConfirmEditOpen] = useState(false)
  const [pendingEditData, setPendingEditData] = useState(null)

  const [showValidado, setShowValidado] = useState(false)
  const [validadoMessage, setValidadoMessage] = useState("")

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewBarrel, setViewBarrel] = useState(null)

  const fetchBarrels = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/api/barriles`)
      if (!res.ok) throw new Error("No se pudieron obtener los barriles")
      const data = await res.json()
      setBarrels(data || [])
    } catch (err) {
      console.error(err)
      setError("Error al obtener los barriles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBarrels()
  }, [])

  // abrir modal agregar
  const handleOpenAddModal = () => {
    setModalMode("create")
    setSelectedBarrel(null)
    setIsModalOpen(true)
  }

  // agregar barril
  const handleAddBarril = async (formData) => {
    try {
      const { id, codigo_interno, codigo_qr, ...payload } = formData

      const res = await fetch(`${API_BASE_URL}/api/barriles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("No se pudo crear el barril")

      setIsModalOpen(false)
      await fetchBarrels()
      setValidadoMessage("Barril agregado correctamente.")
      setShowValidado(true)
    } catch (err) {
      console.error(err)
      alert("Error al agregar barril")
    }
  }

  // editar barril
  const handleClickEdit = (barrel) => {
    setModalMode("edit")
    setSelectedBarrel(barrel)
    setIsModalOpen(true)
  }

  const handlePrepareEdit = (formData) => {
    setPendingEditData(formData)
    setIsModalOpen(false)
    setConfirmEditOpen(true)
  }

  const handleConfirmEdit = async () => {
    if (!pendingEditData || !pendingEditData.id) {
      setConfirmEditOpen(false)
      return
    }

    try {
      const { id, codigo_interno, codigo_qr, ...updateData } = pendingEditData

      const res = await fetch(`${API_BASE_URL}/api/barriles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) throw new Error("No se pudo actualizar el barril")

      setConfirmEditOpen(false)
      setPendingEditData(null)
      setSelectedBarrel(null)

      await fetchBarrels()

      setValidadoMessage(`Barril #${id} actualizado correctamente.`)
      setShowValidado(true)
    } catch (err) {
      console.error(err)
      setConfirmEditOpen(false)
      alert("Error al actualizar barril")
    }
  }

  // eliminar barril
  const handleClickDelete = (barrel) => {
    setBarrelToDelete(barrel)
    setConfirmDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!barrelToDelete) {
      setConfirmDeleteOpen(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/barriles/${barrelToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("No se pudo eliminar el barril")

      const deletedId = barrelToDelete.id

      setConfirmDeleteOpen(false)
      setBarrelToDelete(null)

      await fetchBarrels()

      setValidadoMessage(`Barril #${deletedId} eliminado correctamente.`)
      setShowValidado(true)
    } catch (err) {
      console.error(err)
      setConfirmDeleteOpen(false)
      alert("Error al eliminar barril")
    }
  }

  // ver detalle
  const handleViewBarrel = (barrel) => {
    setViewBarrel(barrel)
    setViewModalOpen(true)
  }

  // datos del gráfico
  const chartDataRaw = buildChartData(barrels)
  const chartData = chartDataRaw.length > 0 ? chartDataRaw : barrelsDataDemo

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <Barrel className="w-8 h-8" />
          Gestión de Barriles
        </h1>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Agregar Barril
        </button>
      </div>

      {/* modal agregar/editar */}
      <AgregarBarrilModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBarrel(null)
        }}
        mode={modalMode}
        initialBarril={selectedBarrel}
        onSubmit={modalMode === "create" ? handleAddBarril : handlePrepareEdit}
      />

      {/* modal vista full */}
      <BarrilVistaFullModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setViewBarrel(null)
        }}
        barril={viewBarrel}
      />

      {/* Confirmaciones */}
      <ConfirmDialog
        open={confirmEditOpen}
        title="Guardar cambios"
        message={
          pendingEditData
            ? `¿Deseas guardar los cambios del barril #${pendingEditData.id} (${pendingEditData.codigo_interno})?`
            : "¿Deseas guardar los cambios?"
        }
        confirmLabel="Guardar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmEdit}
        onCancel={() => setConfirmEditOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar barril"
        message={
          barrelToDelete
            ? `¿Estás seguro de eliminar el barril #${barrelToDelete.id} (${barrelToDelete.codigo_interno})?`
            : "¿Estás seguro de eliminar este barril?"
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setBarrelToDelete(null)
        }}
      />

      {/* Validado */}
      <ValidadoCard
        open={showValidado}
        title="Operación exitosa"
        message={validadoMessage}
        onClose={() => setShowValidado(false)}
      />

      {/* GRAFICO */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Evolución por Tipo de Cerveza
        </h2>
        <p className="text-xs text-muted-foreground mb-2">
          Cantidad de barriles y capacidad total por tipo de cerveza.
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
              }}
              formatter={(value, name) => {
                if (name === "capacidad") return [`${value} L`, "Capacidad Total"]
                if (name === "cantidad") return [value, "Cantidad de Barriles"]
                return [value, name]
              }}
              labelFormatter={(label) => `Tipo: ${label}`}
            />
            <Legend />

            {/* Cantidad de barriles – dorado */}
            <Line
              type="monotone"
              dataKey="cantidad"
              name="Cantidad de Barriles"
              stroke="#d4af37"
              strokeWidth={2}
              dot={{ fill: "#d4af37" }}
            />

            {/* Capacidad total – naranjo punteado */}
            <Line
              type="monotone"
              dataKey="capacidad"
              name="Capacidad Total (L)"
              stroke="#ff8c42"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ fill: "#ff8c42" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TABLA */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Estado de Barriles</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-accent font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Código</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">QR</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Estado</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Ubicación</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Capacidad</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                    Cargando barriles...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && barrels.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                    No hay barriles registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                barrels.map((barrel) => {
                  const capPercent = getCapacidadPercent(barrel.capacidad_litros)

                  return (
                    <tr key={barrel.id} className="border-b border-border hover:bg-secondary">
                      <td className="px-4 py-3 text-foreground">#{barrel.id}</td>
                      <td className="px-4 py-3 text-foreground">{barrel.codigo_interno}</td>

                      <td className="px-4 py-3">
                        {barrel.codigo_qr ? (
                          <div className="bg-background p-1 rounded">
                            <QRCode value={barrel.codigo_qr} size={40} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin QR</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${getEstadoClasses(
                            barrel.estado_actual
                          )}`}
                        >
                          {barrel.estado_actual}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-foreground">{barrel.tipo_cerveza}</td>
                      <td className="px-4 py-3 text-foreground">{barrel.ubicacion_actual}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sidebar-primary to-accent"
                              style={{ width: `${capPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {barrel.capacidad_litros} L
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 flex gap-2">
                        <button
                          className="p-2 hover:bg-secondary rounded text-foreground"
                          onClick={() => handleViewBarrel(barrel)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 hover:bg-secondary rounded text-accent"
                          onClick={() => handleClickEdit(barrel)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 hover:bg-secondary rounded text-destructive"
                          onClick={() => handleClickDelete(barrel)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
