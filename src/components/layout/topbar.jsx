"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PerfilVistaFull from "../modales/perfilVista-full"

export default function TopBar({ sidebarOpen, setSidebarOpen, onLogout }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [userName, setUserName] = useState("Usuario")
  const [userInitial, setUserInitial] = useState("T")

  const navigate = useNavigate()

  // Leer usuario desde localStorage para mostrar nombre e inicial
  useEffect(() => {
    try {
      const stored = localStorage.getItem("usuario")
      if (stored) {
        const parsed = JSON.parse(stored)

        const nombre =
          parsed?.nombre_completo ||
          parsed?.nombre ||
          parsed?.username ||
          parsed?.user ||
          "Usuario"

        setUserName(nombre)

        const inicial =
          (nombre && nombre.trim().charAt(0).toUpperCase()) || "U"
        setUserInitial(inicial)
      } else {
        setUserName("Usuario")
        setUserInitial("T")
      }
    } catch {
      setUserName("Usuario")
      setUserInitial("T")
    }
  }, [])

  const handleToggleMenu = () => {
    setShowMenu((prev) => !prev)
  }

  const handleVerPerfil = () => {
    setShowMenu(false)
    setShowPerfilModal(true)
  }

  const handleClosePerfil = () => {
    setShowPerfilModal(false)
  }

  const handleLogout = () => {
    setShowMenu(false)

    // Preferimos que App maneje la sesión
    if (typeof onLogout === "function") {
      onLogout()
      return
    }

    // Fallback por si no se pasa onLogout
    try {
      localStorage.removeItem("usuario")
    } catch (e) {
      // ignore
    }
    navigate("/login", { replace: true })
  }

  return (
    <>
      <header className="bg-card border-b border-border px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Botón sidebar (izquierda) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <span className="sr-only">Abrir / cerrar menú lateral</span>
          <span className="block w-5 h-[2px] bg-foreground mb-[5px] rounded"></span>
          <span className="block w-4 h-[2px] bg-foreground mb-[5px] rounded"></span>
          <span className="block w-3 h-[2px] bg-foreground rounded"></span>
        </button>

        {/* Título centrado */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg md:text-2xl font-bold tracking-wide text-foreground select-none">
            Totem
          </h1>
        </div>

        {/* Área derecha: usuario + menú */}
        <div className="flex items-center gap-3">
          {/* Info rápida usuario (avatar + texto) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-semibold">
              {userInitial}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">
                {userName}
              </span>
              <span className="text-[11px] text-foreground/60">Sesión activa</span>
            </div>
          </div>

          {/* Menú de 3 puntos */}
          <div className="relative">
            <button
              onClick={handleToggleMenu}
              className="p-2 hover:bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60"
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <span className="text-xl leading-none">⋯</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={handleVerPerfil}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                  type="button"
                >
                  <span>👤</span>
                  <span>Ver perfil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
                  type="button"
                >
                  <span>🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de perfil */}
      <PerfilVistaFull isOpen={showPerfilModal} onClose={handleClosePerfil} />
    </>
  )
}
