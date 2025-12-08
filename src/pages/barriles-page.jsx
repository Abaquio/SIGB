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

// Clases para estado
function getEstadoClasses(estado) {
  switch (estado) {
    case "DISPONIBLE":
      return "bg-emerald-500/20 text-emerald-400"
    case "EN_USO":
      return "bg-orange-500/20 text-orange-400"
    case "LIMPIEZA":
      return "bg-sky-500/20 text-sky-400"
    case "MANTENIMIENTO":
      return "bg-amber-500/20 text-amber-400"
    default:
      return "bg-gray-500/20 text-gray-400"
  }
}

// Para la barra de capacidad
const getCapacidadPercent = (capacidad) => {
  const cap = Number(capacidad) || 0
  if (cap <= 0) return 0
  // aquí podrías normalizar si tuvieras rango máximo, por ahora 100% siempre que tenga valor
  return 100
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
      if (!res.ok) throw new Error("Error en la respuesta de la API")

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

    if (!res.ok) {
      let info = null
      try {
        info = await res.json()
      } catch {
        try {
          const text = await res.text()
          console.error("Respuesta cruda backend /api/barriles:", text)
        } catch (e) {
          console.error("No se pudo leer el body del error:", e)
        }
      }

      console.error("❌ Error backend /api/barriles:", info)
      const msg =
        info?.details ||
        info?.error ||
        "No se pudo crear el barril (ver consola para más detalles)"

      throw new Error(msg)
    }

    // si todo ok
    setIsModalOpen(false)
    await fetchBarrels()

    setValidadoMessage("Barril agregado correctamente.")
    setShowValidado(true)
  } catch (err) {
    console.error("Error al agregar barril:", err)
    alert(err.message || "Error al agregar barril")
  }
}


  // preparar edición → abre confirm después de enviar desde el modal
  const handlePrepareEdit = (formData) => {
    setPendingEditData(formData)
    setConfirmEditOpen(true)
  }

  // confirmar edición
  const handleConfirmEdit = async () => {
    if (!pendingEditData) return

    try {
      const { id, codigo_interno, codigo_qr, ...updateData } = pendingEditData

      const res = await fetch(`${API_BASE_URL}/api/barriles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) throw new Error("No se pudo actualizar el barril")

      setConfirmEditOpen(false)
      setIsModalOpen(false)
      setSelectedBarrel(null)
      setPendingEditData(null)

      await fetchBarrels()
      setValidadoMessage(`Barril #${id} actualizado correctamente.`)
      setShowValidado(true)
    } catch (err) {
      console.error(err)
      setConfirmEditOpen(false)
      alert("Error al actualizar barril")
    }
  }

  // abrir confirmación de borrado
  const handleClickDelete = (barrel) => {
    setBarrelToDelete(barrel)
    setConfirmDeleteOpen(true)
  }

  // confirmar borrado
  const handleConfirmDelete = async () => {
    if (!barrelToDelete) return

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

      {/* MODAL AGREGAR / EDITAR */}
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

      {/* MODAL VISTA FULL */}
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
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Resumen por tipo de cerveza
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cantidad"
                name="Cantidad de barriles"
                stroke="#facc15"
              />
              <Line
                type="monotone"
                dataKey="capacidad"
                name="Capacidad total (L)"
                stroke="#22c55e"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-card border border-border rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Código interno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  QR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Tipo de cerveza
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Ubicación actual
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Capacidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-4 text-center text-muted-foreground"
                  >
                    Cargando barriles...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-4 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && barrels.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-4 text-center text-muted-foreground"
                  >
                    No hay barriles registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                barrels.map((barrel) => {
                  const capPercent = getCapacidadPercent(barrel.capacidad_litros)

                  return (
                    <tr
                      key={barrel.id}
                      className="border-b border-border hover:bg-secondary"
                    >
                      <td className="px-4 py-3 text-foreground">
                        #{barrel.id}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {barrel.codigo_interno}
                      </td>

                      <td className="px-4 py-3">
                        {barrel.codigo_qr ? (
                          <div className="bg-background p-1 rounded">
                            <QRCode value={barrel.codigo_qr} size={40} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sin QR
                          </span>
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

                      <td className="px-4 py-3 text-foreground">
                        {barrel.tipo_cerveza || "—"}
                      </td>

                      <td className="px-4 py-3 text-foreground">
                        {barrel.ubicacion_actual || "—"}
                      </td>

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
                          className="p-2 hover:bg-secondary rounded text-foreground"
                          onClick={() => {
                            setModalMode("edit")
                            setSelectedBarrel(barrel)
                            setIsModalOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          className="p-2 hover:bg-red-600/10 rounded text-red-500 hover:text-red-400"
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
