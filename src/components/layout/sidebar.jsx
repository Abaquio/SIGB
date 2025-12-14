"use client"

export default function Sidebar({
  activeNav,
  setActiveNav,
  sidebarOpen = true,
  setSidebarOpen,
  usuario,
}) {
  const rol = usuario?.rol // si usas rolCodigo, cambia aquí

  // 🔐 Menú por rol
  const navItemsByRole = {
    VENDEDOR: [
      { id: "inicio", label: "Inicio", emoji: "🏠" },
      { id: "pos", label: "Ventas", emoji: "💳" },
      { id: "devoluciones", label: "Devoluciones", emoji: "↩️" },
    ],
    OPERARIO: [
      { id: "barriles", label: "Barriles", emoji: "🛢️" },
      { id: "escanear", label: "Escáner QR", emoji: "📱" },
      { id: "bodegas", label: "Bodegas", emoji: "🏬" },
      { id: "movimientos", label: "Movimientos", emoji: "📊" },
    ],
    SUPERVISOR: [
      { id: "inicio", label: "Inicio", emoji: "🏠" },
      { id: "pos", label: "Ventas", emoji: "💳" },
      { id: "devoluciones", label: "Devoluciones", emoji: "↩️" },
      { id: "barriles", label: "Barriles", emoji: "🛢️" },
      { id: "escanear", label: "Escáner QR", emoji: "📱" },
      { id: "bodegas", label: "Bodegas", emoji: "🏬" },
      { id: "movimientos", label: "Movimientos", emoji: "📊" },
      { id: "reportes", label: "Reportes", emoji: "📈" },
      { id: "alertas", label: "Alertas", emoji: "🚨" },
    ],
    ADMIN: [
      { id: "inicio", label: "Inicio", emoji: "🏠" },
      { id: "pos", label: "Ventas", emoji: "💳" },
      { id: "devoluciones", label: "Devoluciones", emoji: "↩️" },
      { id: "barriles", label: "Barriles", emoji: "🛢️" },
      { id: "escanear", label: "Escáner QR", emoji: "📱" },
      { id: "bodegas", label: "Bodegas", emoji: "🏬" },
      { id: "movimientos", label: "Movimientos", emoji: "📊" },
      { id: "reportes", label: "Reportes", emoji: "📈" },
      { id: "alertas", label: "Alertas", emoji: "🚨" },
      { id: "staff", label: "Staff", emoji: "👥" },
    ],
  }

  const navItems = navItemsByRole[rol] || []

  const handleNavClick = (id) => {
    setActiveNav(id)
    if (setSidebarOpen) setSidebarOpen(false)
  }

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-sidebar border-r border-sidebar-border flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-sidebar-primary font-bold text-lg">🍺 BrewMaster</h1>
          <p className="text-sidebar-accent-foreground text-xs">
            Rol: {rol?.toLowerCase()}
          </p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
