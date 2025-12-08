"use client"

import { useEffect, useState } from "react"
import { Eye, Edit, Trash2 } from "lucide-react"
import AgregarBarrilModal from "./agregarBarril-modal"
import ConfirmDialog from "../ui/confirm"
import ValidadoCard from "../ui/validado"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function BodegaVistaFull({
  isOpen,
  onClose,
  bodega,
  onEstadoGuardado, // callback desde la page para refrescar tabla de bodegas + toast
}) {
  const [barriles, setBarriles] = useState([])
  const [loadingBarriles, setLoadingBarriles] = useState(false)
  const [errorBarriles, setErrorBarriles] = useState(null)

  const [editingBarril, setEditingBarril] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // estado local de la bodega
  const [bodegaDetalle, setBodegaDetalle] = useState(bodega || null)
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("ACTIVA")

  // confirm / validado para ELIMINAR barril
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [barrelToDelete, setBarrelToDelete] = useState(null)
  const [showValidado, setShowValidado] = useState(false)
  const [validadoMessage, setValidadoMessage] = useState("")

  useEffect(() => {
    if (isOpen && bodega) {
      setBodegaDetalle(bodega)
      setEstadoSeleccionado(bodega.activo ? "ACTIVA" : "INACTIVA")
    }
  }, [isOpen, bodega])

  const bodegaId = bodegaDetalle?.id

  // --------------------------
  // Cargar barriles
  // --------------------------
  const fetchBarriles = async () => {
    if (!bodegaId) return

    try {
      setLoadingBarriles(true)
      setErrorBarriles(null)

      const res = await fetch(`${API_BASE_URL}/api/barriles`)
      if (!res.ok) {
        const info = await res.json().catch(() => null)
        throw new Error(
          info?.details || info?.error || "Error al obtener barriles",
        )
      }

      const data = await res.json()
      setBarriles(data || [])
    } catch (err) {
      console.error("Error al obtener barriles:", err)
      setErrorBarriles(err.message || "Error al obtener barriles")
    } finally {
      setLoadingBarriles(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !bodegaId) return
    fetchBarriles()
  }, [isOpen, bodegaId])

  if (!isOpen || !bodegaDetalle) return null

  const barrilesAsociados = barriles.filter((b) => b.bodega_id === bodegaId)

  const handleClose = () => {
    onClose?.()
    setEditingBarril(null)
    setEditModalOpen(false)
  }

  // --------------------------
  // Guardar cambios de estado (botón amarillo)
  // --------------------------
  const handleGuardarCambios = async () => {
    if (!bodegaDetalle.id) return

    const nuevoActivo = estadoSeleccionado === "ACTIVA"

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/bodegas/${bodegaDetalle.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: nuevoActivo }),
        },
      )

      if (!res.ok) {
        const info = await res.json().catch(() => null)
        throw new Error(
          info?.details ||
            info?.error ||
            "No se pudieron guardar los cambios de la bodega",
        )
      }

      setBodegaDetalle((prev) =>
        prev ? { ...prev, activo: nuevoActivo } : prev,
      )

      // Avisar al padre (refresca tabla + muestra validado allí)
      onEstadoGuardado?.()

      handleClose()
    } catch (err) {
      console.error("Error al guardar cambios de bodega:", err)
      alert(err.message || "Error al guardar cambios de la bodega")
    }
  }

  // --------------------------
  // Ver / Editar barril
  // --------------------------
  const handleVerBarril = (barril) => {
    setEditingBarril(barril)
    setEditModalOpen(true)
  }

  const handleEditarBarrilClick = (barril) => {
    setEditingBarril(barril)
    setEditModalOpen(true)
  }

  const handleSubmitEditarBarril = async (payload) => {
    if (!editingBarril?.id) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/barriles/${editingBarril.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const info = await res.json().catch(() => null)
        throw new Error(
          info?.details || info?.error || "No se pudo actualizar el barril",
        )
      }

      await fetchBarriles()

      setEditModalOpen(false)
      setEditingBarril(null)
    } catch (err) {
      console.error("Error al editar barril:", err)
      alert(err.message || "Error al editar barril")
    }
  }

  // --------------------------
  // Eliminar barril con CONFIRM DIALOG
  // --------------------------
  const handleClickDelete = (barril) => {
    setBarrelToDelete(barril)
    setConfirmDeleteOpen(true)
  }

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

      await fetchBarriles()

      setValidadoMessage(`Barril #${deletedId} eliminado correctamente.`)
      setShowValidado(true)
    } catch (err) {
      console.error(err)
      setConfirmDeleteOpen(false)
      setBarrelToDelete(null)
      alert("Error al eliminar barril")
    }
  }

  const isActiva = estadoSeleccionado === "ACTIVA"

  return (
    <>
      {/* MODAL PRINCIPAL BODEGA */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {bodegaDetalle.nombre}
              </h2>
              <p className="text-sm text-muted-foreground">
                Detalle completo de la bodega y barriles asociados
              </p>
            </div>
            <button
              onClick={handleClose}
              className="px-3 py-1 rounded-md text-sm bg-muted hover:bg-muted/80 text-foreground"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Info principal de la bodega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-foreground font-medium">
                  {bodegaDetalle.tipo}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="text-foreground font-medium">
                  {bodegaDetalle.direccion || "—"}
                </p>
              </div>
              {/* ESTADO COMO SELECT */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <select
                  value={estadoSeleccionado}
                  onChange={(e) => setEstadoSeleccionado(e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border bg-transparent focus:outline-none focus:ring-2 ${
                    isActiva
                      ? "border-emerald-500 text-emerald-400 focus:ring-emerald-500/40"
                      : "border-red-500 text-red-400 focus:ring-red-500/40"
                  }`}
                >
                  <option value="ACTIVA">Activa</option>
                  <option value="INACTIVA">Inactiva</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Descripción</p>
                <p className="text-foreground">
                  {bodegaDetalle.descripcion || "Sin descripción"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha creación</p>
                <p className="text-foreground font-medium">
                  {new Date(bodegaDetalle.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Barriles asociados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Barriles asociados
              </h3>
              {loadingBarriles && (
                <p className="text-xs text-muted-foreground">
                  Cargando barriles...
                </p>
              )}
            </div>

            {errorBarriles && (
              <p className="text-sm text-red-500">{errorBarriles}</p>
            )}

            {!loadingBarriles &&
              !errorBarriles &&
              barrilesAsociados.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Esta bodega no tiene barriles asociados actualmente.
                </p>
              )}

            {!loadingBarriles &&
              !errorBarriles &&
              barrilesAsociados.length > 0 && (
                <div className="bg-muted/40 border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs md:text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-3 md:px-4 py-2 text-left font-semibold text-foreground">
                          Código interno
                        </th>
                        <th className="px-3 md:px-4 py-2 text-left font-semibold text-foreground">
                          Tipo cerveza
                        </th>
                        <th className="px-3 md:px-4 py-2 text-left font-semibold text-foreground">
                          Capacidad (L)
                        </th>
                        <th className="px-3 md:px-4 py-2 text-left font-semibold text-foreground">
                          Estado
                        </th>
                        <th className="px-3 md:px-4 py-2 text-left font-semibold text-foreground">
                          Fecha alta
                        </th>
                        <th className="px-3 md:px-4 py-2 text-left font-semibold text-foreground">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {barrilesAsociados.map((barril) => (
                        <tr
                          key={barril.id}
                          className="border-b border-border last:border-b-0 hover:bg-card/60 transition-colors"
                        >
                          <td className="px-3 md:px-4 py-2 text-foreground font-medium">
                            {barril.codigo_interno}
                          </td>
                          <td className="px-3 md:px-4 py-2 text-foreground">
                            {barril.tipo_cerveza || "—"}
                          </td>
                          <td className="px-3 md:px-4 py-2 text-foreground">
                            {barril.capacidad_litros ?? "—"}
                          </td>
                          <td className="px-3 md:px-4 py-2 text-foreground">
                            {barril.estado_actual}
                          </td>
                          <td className="px-3 md:px-4 py-2 text-foreground">
                            {barril.fecha_alta
                              ? new Date(barril.fecha_alta).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-3 md:px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                className="p-2 hover:bg-secondary rounded text-foreground"
                                onClick={() => handleVerBarril(barril)}
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                className="p-2 hover:bg-secondary rounded text-foreground"
                                onClick={() => handleEditarBarrilClick(barril)}
                                title="Editar barril"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                className="p-2 hover:bg-red-600/10 rounded text-red-500 hover:text-red-400"
                                onClick={() => handleClickDelete(barril)}
                                title="Eliminar barril"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Botón GUARDAR CAMBIOS (amarillo) */}
          <div className="mt-6 md:mt-8">
            <button
              onClick={handleGuardarCambios}
              className="w-full px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      {/* MODAL EDITAR / VER BARRIL */}
      <AgregarBarrilModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingBarril(null)
        }}
        mode="edit"
        initialBarril={editingBarril}
        onSubmit={handleSubmitEditarBarril}
      />

      {/* CONFIRM ELIMINAR BARRIL */}
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

      {/* VALIDADO LOCAL (elim barril) */}
      <ValidadoCard
        open={showValidado}
        title="Operación exitosa"
        message={validadoMessage}
        onClose={() => setShowValidado(false)}
      />
    </>
  )
}
