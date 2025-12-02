"use client"

import { useState } from "react"

export default function TopBar({ sidebarOpen, setSidebarOpen }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 hover:bg-secondary rounded-lg transition-colors"
      >
        <span className="text-xl">☰</span>
      </button>

      <div className="text-center flex-1">
        <h2 className="text-accent font-bold text-2xl">BrewMaster</h2>
      </div>

      <div className="flex-1 flex items-center justify-end gap-4">
        {/* User Icon */}
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <span className="text-xl">👤</span>
        </button>

        {/* Menu de tres puntos */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <span className="text-xl">⋯</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in-50 duration-200">
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-t-lg transition-colors text-foreground">
                <span>👤</span>
                <span>Ver Perfil</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-foreground">
                <span>⚙️</span>
                <span>Configuración</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-b-lg transition-colors text-destructive">
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
