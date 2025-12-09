"use client"

import Sidebar from "./sidebar"
import TopBar from "./topbar"

export default function Layout({
  children,
  activeNav,
  setActiveNav,
  sidebarOpen,
  setSidebarOpen,
  onLogout, // opcional, por si App.jsx lo pasa
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* SIDEBAR */}
      {sidebarOpen && (
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-slate-900 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
