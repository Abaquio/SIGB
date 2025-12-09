"use client"

import { useState, useEffect } from "react"

export default function PerfilVistaFull({ isOpen, onClose }) {
  const [editMode, setEditMode] = useState(false)

  const [userData, setUserData] = useState({
    id: null,
    nombre: "Usuario Totem",
    email: "usuario@totem.cl",
    telefono: "+56 9 1234 5678",
    empresa: "Cervecería Totem",
    cargo: "Usuario",
    rut: "12345678-9",
    fechaRegistro: "Pendiente",
  })

  const roleOptions = ["ADMIN", "OPERARIO", "SUPERVISOR", "VENDEDOR"]

  // Cargar datos reales desde localStorage.usuario
  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario")
      if (!stored) return

      const u = JSON.parse(stored)

      const nombre =
        u?.nombre_completo ||
        u?.nombre ||
        userData.nombre

      const email = u?.email || userData.email

      const telefono = u?.telefono
        ? `+56 ${u.telefono}`
        : userData.telefono

      const rut = u?.rut || userData.rut
      const cargo = u?.rol || userData.cargo

      let fechaRegistro = userData.fechaRegistro
      if (u?.created_at) {
        try {
          const d = new Date(u.created_at)
          fechaRegistro = d.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        } catch {
          // dejamos la por defecto
        }
      }

      setUserData((prev) => ({
        ...prev,
        id: u?.id ?? prev.id,
        nombre,
        email,
        telefono,
        rut,
        cargo,
        fechaRegistro,
      }))
    } catch (e) {
      console.error("Error leyendo usuario desde localStorage", e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-200">
      {/* CONTENEDOR FULLSCREEN */}
      <div className="bg-background w-full h-full max-h-screen max-w-screen overflow-hidden shadow-xl animate-in zoom-in duration-300 flex flex-col border border-border rounded-none">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-2xl font-bold text-accent">Mi Perfil</h2>
            <p className="text-sm text-foreground/60">
              Información de la cuenta e inicio de sesión
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className="hidden md:inline-flex px-4 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
            >
              {editMode ? "Salir de edición" : "Editar perfil"}
            </button>

            <button
              onClick={onClose}
              className="text-3xl leading-none text-foreground hover:text-accent transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* PANEL IZQUIERDO */}
            <div className="lg:col-span-1 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-5xl font-semibold mb-4">
                  {userData.nombre.charAt(0).toUpperCase()}
                </div>

                <h3 className="text-xl font-semibold text-foreground">
                  {userData.nombre}
                </h3>

                <p className="text-sm text-foreground/60 mt-1">
                  {userData.cargo}
                </p>

                <p className="text-xs text-foreground/40">
                  {userData.empresa}
                </p>
              </div>

              {/* Info corta */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">RUT</span>
                  <span className="font-medium">{userData.rut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Miembro desde</span>
                  <span className="font-medium">{userData.fechaRegistro}</span>
                </div>
              </div>

              {/* Estado */}
              <div className="bg-card border border-border rounded-xl p-5 text-sm">
                <p className="text-foreground/60 mb-1">Estado de la cuenta</p>
                <p className="font-medium text-green-400">Activa</p>
              </div>
            </div>

            {/* PANEL DERECHO */}
            <div className="lg:col-span-2 space-y-10">
              {/* Información personal */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-5">
                  Información personal
                </h3>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  {/* Nombre (solo lectura) */}
                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Nombre</p>
                    <p className="font-medium">{userData.nombre}</p>
                  </div>

                  {/* Correo (editable) */}
                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Correo</p>
                    {!editMode ? (
                      <p className="font-medium break-all">
                        {userData.email}
                      </p>
                    ) : (
                      <input
                        className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
                        value={userData.email}
                        onChange={(e) =>
                          handleChange("email", e.target.value)
                        }
                      />
                    )}
                  </div>

                  {/* Teléfono (editable) */}
                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Teléfono</p>
                    {!editMode ? (
                      <p className="font-medium">{userData.telefono}</p>
                    ) : (
                      <input
                        className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
                        value={userData.telefono}
                        onChange={(e) =>
                          handleChange("telefono", e.target.value)
                        }
                      />
                    )}
                  </div>

                  {/* Rol (editable con select) */}
                  <div>
                    <p className="text-foreground/60 text-xs mb-1">Rol</p>
                    {!editMode ? (
                      <p className="font-medium">{userData.cargo}</p>
                    ) : (
                      <select
                        className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground"
                        value={userData.cargo}
                        onChange={(e) =>
                          handleChange("cargo", e.target.value)
                        }
                      >
                        {roleOptions.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {editMode && (
                  <p className="mt-4 text-[11px] text-foreground/40">
                    * Por ahora los cambios se guardan solo en esta vista. En
                    una próxima versión se conectará al backend para actualizar
                    tu perfil en la base de datos.
                  </p>
                )}
              </div>

              {/* Información de inicio de sesión */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-5">
                  Información de inicio de sesión
                </h3>

                <p className="text-sm text-foreground/70 mb-4">
                  Aquí verás tus últimos accesos, dispositivos usados y actividad
                  en la cuenta cuando integremos auditoría de login.
                </p>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="bg-background border border-dashed border-border rounded-lg p-4">
                    <p className="text-foreground/60 text-xs mb-1">
                      Último inicio de sesión
                    </p>
                    <p className="font-medium">Pendiente de integración</p>
                  </div>

                  <div className="bg-background border border-dashed border-border rounded-lg p-4">
                    <p className="text-foreground/60 text-xs mb-1">
                      Sesiones activas
                    </p>
                    <p className="font-medium">Pendiente de integración</p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-foreground/40">
                  * Esta sección se conectará a la tabla{" "}
                  <span className="font-semibold">auditoria_login</span> en una
                  próxima versión.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER (solo mobile) */}
        <div className="p-4 border-t border-border bg-card flex justify-end md:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-80 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
