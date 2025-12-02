"use client"

const navItems = [
  { id: "inicio", label: "Inicio", emoji: "🏠" },
  { id: "barriles", label: "Barriles", emoji: "🛢️" },
  { id: "movimientos", label: "Movimientos", emoji: "📊" },
  { id: "escanear", label: "Escanear QR", emoji: "📱" },
  { id: "historial", label: "Historial", emoji: "📜" },
  { id: "reportes", label: "Reportes", emoji: "📈" },
  { id: "alertas", label: "Alertas", emoji: "🚨" },
]

export default function Sidebar({
  activeNav,
  setActiveNav,
  sidebarOpen = true,
  setSidebarOpen,
}) {
  const handleNavClick = (id) => {
    setActiveNav(id)
    // Siempre marcamos sidebarOpen = false.
    // En desktop no se esconde gracias a md:translate-x-0,
    // en mobile sí se cierra.
    if (setSidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Backdrop para mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen && setSidebarOpen(false)}
      />

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-sidebar border-r border-sidebar-border flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">🍺</span>
            </div>
            <div>
              <h1 className="text-sidebar-primary font-bold text-lg">BrewMaster</h1>
              <p className="text-sidebar-accent-foreground text-xs">Gestión de Cervecería</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
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

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-sidebar-accent-foreground text-xs text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  )
}
