"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PerfilVistaFull from "../modales/perfilVista-full"

export default function TopBar({ sidebarOpen, setSidebarOpen, onLogout, activeNav }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [userName, setUserName] = useState("Usuario")
  const [userInitial, setUserInitial] = useState("T")

  const navigate = useNavigate()

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
        setUserInitial((nombre && nombre.trim().charAt(0).toUpperCase()) || "U")
      } else {
        setUserName("Usuario")
        setUserInitial("T")
      }
    } catch {
      setUserName("Usuario")
      setUserInitial("T")
    }
  }, [])

  const handleLogout = () => {
    setShowMenu(false)

    if (typeof onLogout === "function") {
      onLogout()
      return
    }

    try {
      localStorage.removeItem("usuario")
    } catch {}
    navigate("/login", { replace: true })
  }

  const showPosHeader = activeNav === "pos"

  // ✅ Caja
  const openCaja = () => {
    try {
      if (typeof window.__openCajaModal === "function") {
        window.__openCajaModal()
        return
      }
      window.dispatchEvent(new Event("open-caja-modal"))
    } catch (e) {
      console.error("openCaja error:", e)
    }
  }

  // ✅ Barriles
  const openBarriles = () => {
    try {
      if (typeof window.__openBarrilesModal === "function") {
        window.__openBarrilesModal()
        return
      }
      window.dispatchEvent(new Event("open-barriles-modal"))
    } catch (e) {
      console.error("openBarriles error:", e)
    }
  }

  // ✅ Historial ventas (igual que Caja/Barriles)
  const openHistorial = () => {
    try {
      if (typeof window.__openHistorialVentasModal === "function") {
        window.__openHistorialVentasModal()
        return
      }
      window.dispatchEvent(new Event("open-historial-ventas"))
    } catch (e) {
      console.error("openHistorial error:", e)
    }
  }

  return (
    <>
      <header className="bg-card border-b border-border px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <span className="sr-only">Abrir / cerrar menú lateral</span>
          <span className="block w-5 h-[2px] bg-foreground mb-[5px] rounded"></span>
          <span className="block w-4 h-[2px] bg-foreground mb-[5px] rounded"></span>
          <span className="block w-3 h-[2px] bg-foreground rounded"></span>
        </button>

        {/* Centro */}
        <div className="flex-1 flex justify-center">
          {showPosHeader ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCaja}
                className="px-4 py-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors"
                title="Abrir/Cerrar caja"
              >
                <span className="text-sm md:text-base font-semibold text-foreground select-none">
                  Caja
                </span>
              </button>

              <button
                type="button"
                onClick={openBarriles}
                className="px-4 py-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors"
                title="Elección de barriles"
              >
                <span className="text-sm md:text-base font-semibold text-foreground select-none">
                  Elección de barriles
                </span>
              </button>

              <button
                type="button"
                onClick={openHistorial}
                className="px-4 py-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors"
                title="Historial de ventas"
              >
                <span className="text-sm md:text-base font-semibold text-foreground select-none">
                  Historial de ventas
                </span>
              </button>
            </div>
          ) : (
            <div className="h-10" />
          )}
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-semibold">
              {userInitial}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">{userName}</span>
              <span className="text-[11px] text-foreground/60">Sesión activa</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu((p) => !p)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60"
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <span className="text-xl leading-none">⋯</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowPerfilModal(true)
                  }}
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

      <PerfilVistaFull isOpen={showPerfilModal} onClose={() => setShowPerfilModal(false)} />
    </>
  )
}
