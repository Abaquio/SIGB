"use client"

import { useState } from "react"

export default function PerfilVistaFull({ isOpen, onClose }) {
  const [editMode, setEditMode] = useState(false)
  const [userData, setUserData] = useState({
    nombre: "Juan Carlos Pérez",
    email: "juan.perez@brewmaster.com",
    telefono: "+56 9 1234 5678",
    empresa: "BrewMaster S.A.",
    cargo: "Administrador",
    ciudad: "Santiago",
    rut: "12345678-9",
    fechaRegistro: "15 Enero 2024",
  })

  const [formData, setFormData] = useState(userData)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    setUserData(formData)
    setEditMode(false)
  }

  const handleCancel = () => {
    setFormData(userData)
    setEditMode(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-accent">Mi Perfil</h1>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors text-2xl">
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Avatar y básico */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-8 text-center sticky top-20">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-accent to-sidebar-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-6xl">👤</span>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-1">{userData.nombre}</h2>
              <p className="text-accent font-semibold mb-4">{userData.cargo}</p>

              <div className="space-y-3 text-sm text-foreground">
                <div className="py-2 border-b border-border">
                  <p className="text-xs text-gray-500 mb-1">Empresa</p>
                  <p className="font-medium">{userData.empresa}</p>
                </div>
                <div className="py-2 border-b border-border">
                  <p className="text-xs text-gray-500 mb-1">Desde</p>
                  <p className="font-medium">{userData.fechaRegistro}</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    Activo
                  </span>
                </div>
              </div>

              {!editMode && (
                <button
                  onClick={() => {
                    setFormData(userData)
                    setEditMode(true)
                  }}
                  className="w-full mt-6 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          {/* Columna derecha - Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                {editMode ? "Editar Información" : "Información Personal"}
              </h3>

              {editMode ? (
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">Nombre Completo</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">RUT</label>
                      <input
                        type="text"
                        name="rut"
                        value={formData.rut}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">Teléfono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">Cargo</label>
                      <input
                        type="text"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">Ciudad</label>
                      <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleChange}
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-foreground text-sm font-medium mb-2">Empresa</label>
                    <input
                      type="text"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-border">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Nombre Completo</p>
                      <p className="text-foreground font-medium">{userData.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">RUT</p>
                      <p className="text-foreground font-medium">{userData.rut}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Email</p>
                      <p className="text-foreground font-medium">{userData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Teléfono</p>
                      <p className="text-foreground font-medium">{userData.telefono}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Cargo</p>
                      <p className="text-foreground font-medium">{userData.cargo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Ciudad</p>
                      <p className="text-foreground font-medium">{userData.ciudad}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-2">Empresa</p>
                      <p className="text-foreground font-medium">{userData.empresa}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección de seguridad */}
            <div className="bg-card border border-border rounded-lg p-8 mt-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Seguridad</h3>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <span className="text-foreground font-medium">Cambiar Contraseña</span>
                  <span className="text-accent">→</span>
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <span className="text-foreground font-medium">Autenticación de Dos Factores</span>
                  <span className="text-green-400">Activa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
