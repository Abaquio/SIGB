"use client"

import { useEffect, useState } from "react"
import { Eye, Edit } from "lucide-react"
import CrearBodegaModal from "../components/modales/crearBodega-modal"
import ValidadoCard from "../components/ui/validado"
import BodegaVistaFull from "../components/modales/bodega-vistaFull"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function BodegaPage() {
  const [bodegas, setBodegas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showCrearModal, setShowCrearModal] = useState(false)

  // modal detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null)

  // modal editar
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [bodegaEditando, setBodegaEditando] = useState(null)

  // validado (toast)
  const [showValidado, setShowValidado] = useState(false)
  const [validadoTitle, setValidadoTitle] = useState("")
  const [validadoMessage, setValidadoMessage] = useState("")

  // =========================
  // Fetch bodegas
  // =========================
  const fetchBodegas = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/bodegas`)
      if (!res.ok) {
        const info = await res.json().catch(() => null)
        throw new Error(info?.details || info?.error || "Error al obtener bodegas")
      }

      const data = await res.json()
      setBodegas(data || [])
    } catch (err) {
      console.error("Error al obtener bodegas:", err)
      setError(err.message || "Error al obtener bodegas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBodegas()
  }, [])

  // =========================
  // Crear bodega
  // =========================
  const handleOpenCrear = () => {
    setShowCrearModal(true)
  }

  const handleCrearBodega = async (formData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bodegas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const info = await res.json().catch(() => null)
        throw new Error(info?.details || info?.error || "No se pudo crear la bodega")
      }

      setShowCrearModal(false)
      await fetchBodegas()

      setValidadoTitle("Bodega creada")
      setValidadoMessage("La bodega se creó correctamente.")
      setShowValidado(true)
    } catch (err) {
      console.error("Error al crear bodega:", err)
      alert(err.message || "Error al crear bodega")
    }
  }

  // =========================
  // Editar bodega
  // =========================
  const handleOpenEditar = (bodega) => {
    setBodegaEditando(bodega)
    setShowEditarModal(true)
  }

  const handleEditarBodega = async (formData) => {
    if (!bodegaEditando?.id) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/bodegas/${bodegaEditando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const info = await res.json().catch(() => null)
        throw new Error(
          info?.details || info?.error || "No se pudo actualizar la bodega",
        )
      }

      setShowEditarModal(false)
      setBodegaEditando(null)
      await fetchBodegas()

      setValidadoTitle("Bodega actualizada")
      setValidadoMessage("Los cambios de la bodega se guardaron correctamente.")
      setShowValidado(true)
    } catch (err) {
      console.error("Error al actualizar bodega:", err)
      alert(err.message || "Error al actualizar bodega")
    }
  }

  // =========================
  // Ver detalle
  // =========================
  const handleVerDetalle = (bodega) => {
    setBodegaSeleccionada(bodega)
    setShowDetalleModal(true)
  }

  // =========================
  // Datos para cards
  // =========================
  const totalBodegas = bodegas.length
  const bodegasActivas = bodegas.filter((b) => b.activo).length
  const bodegasInactivas = bodegas.filter((b) => !b.activo).length
  const ultimaCreada =
    bodegas.length > 0
      ? [...bodegas].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : null

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Bodegas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus bodegas de almacenamiento
          </p>
        </div>
        <button
          onClick={handleOpenCrear}
          className="self-start md:self-auto flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:opacity-90 transition-all text-sm md:text-base"
        >
          <span className="text-lg md:text-xl">➕</span>
          Nueva Bodega
        </button>
      </div>

      {/* Modal crear */}
      <CrearBodegaModal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSubmit={handleCrearBodega}
      />

      {/* Modal editar */}
      <CrearBodegaModal
        isOpen={showEditarModal}
        onClose={() => {
          setShowEditarModal(false)
          setBodegaEditando(null)
        }}
        onSubmit={handleEditarBodega}
        initialData={bodegaEditando}
      />

      {/* Toast validado */}
      <ValidadoCard
        open={showValidado}
        title={validadoTitle}
        message={validadoMessage}
        onClose={() => setShowValidado(false)}
      />

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 md:p-4">
          <p className="text-muted-foreground text-xs md:text-sm">
            Total Bodegas
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {totalBodegas}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 md:p-4">
          <p className="text-muted-foreground text-xs md:text-sm">Activas</p>
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">
            {bodegasActivas}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 md:p-4">
          <p className="text-muted-foreground text-xs md:text-sm">Inactivas</p>
          <p className="text-2xl md:text-3xl font-bold text-amber-400">
            {bodegasInactivas}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 md:p-4">
          <p className="text-muted-foreground text-xs md:text-sm">
            Última creada
          </p>
          <p className="text-sm md:text-base font-semibold text-foreground truncate">
            {ultimaCreada ? ultimaCreada.nombre : "—"}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            {ultimaCreada
              ? new Date(ultimaCreada.created_at).toLocaleString()
              : "Sin registros"}
          </p>
        </div>
      </div>

      {/* Tabla de bodegas (RESPONSIVA) */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-foreground">
                  Nombre
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-foreground">
                  Tipo
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-foreground">
                  Dirección
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-foreground">
                  Estado
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-foreground">
                  Fecha creación
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center font-semibold text-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 sm:px-6 py-4 text-center text-muted-foreground"
                  >
                    Cargando bodegas...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 sm:px-6 py-4 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && bodegas.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 sm:px-6 py-4 text-center text-muted-foreground"
                  >
                    No hay bodegas registradas.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                bodegas.map((bodega) => (
                  <tr
                    key={bodega.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-foreground font-medium">
                      {bodega.nombre}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-foreground">
                      {bodega.tipo}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-foreground max-w-xs truncate">
                      {bodega.direccion || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                          bodega.activo
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-500/20 text-zinc-300"
                        }`}
                      >
                        {bodega.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-foreground whitespace-nowrap">
                      {new Date(bodega.created_at).toLocaleString()}
                    </td>
                    {/* ACCIONES: ver + editar */}
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(bodega)}
                          className="p-2 rounded hover:bg-secondary text-foreground"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditar(bodega)}
                          className="p-2 rounded hover:bg-secondary text-foreground"
                          title="Editar bodega"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Detalle (bodega + barriles, con select de estado y guardar) */}
      <BodegaVistaFull
        isOpen={showDetalleModal}
        bodega={bodegaSeleccionada}
        onClose={() => {
          setShowDetalleModal(false)
          setBodegaSeleccionada(null)
        }}
        onEstadoGuardado={async () => {
          await fetchBodegas()
          setValidadoTitle("Estado de bodega actualizado")
          setValidadoMessage("Los cambios se guardaron correctamente.")
          setShowValidado(true)
        }}
      />
    </div>
  )
}
