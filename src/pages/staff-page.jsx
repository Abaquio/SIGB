"use client"

import { useState, useEffect } from "react"
import NuevoStaffModal from "../components/modales/nuevoStaff-modal"
import StaffDetalleModal from "../components/modales/staffDetalle-modal"
import ValidadoCard from "../components/ui/validado"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showDetalles, setShowDetalles] = useState(false)

  // Toast de validación
  const [toastOpen, setToastOpen] = useState(false)
  const [toastTitle, setToastTitle] = useState("")
  const [toastMessage, setToastMessage] = useState("")

  // Cargar roles desde la API
  const cargarRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles`)
      if (!res.ok) throw new Error("Error al cargar roles")
      const data = await res.json()
      setRoles(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Cargar usuarios desde la API
  const cargarStaff = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/usuarios`)
      if (!res.ok) throw new Error("Error al cargar staff")
      const data = await res.json()

      const normalizados = (data || []).map((u) => {
        const rolCodigo = u.rol || ""
        const cargoLabel =
          rolCodigo === "ADMIN"
            ? "administrador"
            : rolCodigo
            ? rolCodigo.toLowerCase()
            : "sin rol"

        return {
          id: u.id,
          nombre: u.nombre_completo,
          email: u.email,
          telefono: u.telefono || "",
          cargo: cargoLabel,
          rolCodigo,
          rut: u.rut,
          fechaContratacion: u.created_at ? u.created_at.slice(0, 10) : "",
          estado: u.activo ? "activo" : "inactivo",
          rol_id: u.rol_id ?? null,
        }
      })

      setStaff(normalizados)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRoles()
    cargarStaff()
  }, [])

  const handleAddStaff = (nuevoDesdeApi) => {
    setStaff((prev) => [...prev, nuevoDesdeApi])
    setIsModalOpen(false)

    // Mostrar tarjeta de validación
    setToastTitle("Usuario creado")
    setToastMessage(`El usuario "${nuevoDesdeApi.nombre}" fue registrado correctamente.`)
    setToastOpen(true)
  }

  const handleVerDetalles = (miembroStaff) => {
    setSelectedStaff(miembroStaff)
    setShowDetalles(true)
  }

  const handleCloseDetalles = () => {
    setShowDetalles(false)
    setSelectedStaff(null)
  }

  const handleStaffUpdated = (actualizado) => {
    setStaff((prev) => prev.map((s) => (s.id === actualizado.id ? actualizado : s)))
  }

  const totalStaff = staff.length
  const staffActivo = staff.filter((s) => s.estado === "activo").length
  const administradores = staff.filter((s) => s.rolCodigo === "ADMIN").length

  const cargoEmoji = {
    administrador: "👨‍💼",
    ADMIN: "👨‍💼",
    vendedor: "🛍️",
    VENDEDOR: "🛍️",
    bodeguero: "📦",
    OPERARIO: "📦",
    supervisor: "📋",
    SUPERVISOR: "📋",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

        {/* Error / Loading */}
        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Tabla responsiva */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-foreground/60 text-sm">
              Cargando staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="p-6 text-center text-foreground/60 text-sm">
              Aún no hay usuarios registrados.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Cargo
                    </th>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Contratación
                    </th>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-foreground font-semibold text-sm">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staff.map((miembro) => (
                    <tr
                      key={miembro.id}
                      className="hover:bg-secondary/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground font-medium whitespace-nowrap">
                        {miembro.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <span>
                            {cargoEmoji[miembro.cargo] ||
                              cargoEmoji[miembro.rolCodigo] ||
                              "👤"}
                          </span>
                          <span className="text-foreground capitalize">
                            {miembro.cargo}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground/80">
                        {miembro.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-foreground/80">
                        {miembro.telefono || "-"}
                      </td>
                      <td className="px-6 py-4 text-foreground/80 text-sm whitespace-nowrap">
                        {miembro.fechaContratacion || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                            miembro.estado === "activo"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {miembro.estado.charAt(0).toUpperCase() +
                            miembro.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleVerDetalles(miembro)}
                          className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-foreground hover:text-accent text-xs md:text-sm"
                          title="Ver y editar"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Staff */}
      <NuevoStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddStaff={handleAddStaff}
        roles={roles}
      />

      {/* Modal Ver / Editar Staff (externo) */}
      <StaffDetalleModal
        isOpen={showDetalles}
        onClose={handleCloseDetalles}
        staff={selectedStaff}
        roles={roles}
        onUpdated={handleStaffUpdated}
      />

      {/* Tarjeta de validación */}
      <ValidadoCard
        open={toastOpen}
        title={toastTitle}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
      />
    </div>
  )
}
