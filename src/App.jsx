import { useState } from "react"

// 👇 Importamos usando rutas relativas, según tu estructura de la captura
import Layout from "./components/layout/layout"
import Dashboard from "./components/dashboard/dashboard"

import BarrelsPage from "./pages/barriles-page"
import MovimientosPage from "./pages/movimientos-page"
import EscanearPage from "./pages/escanear-page"
import HistorialPage from "./pages/historial-page"
import ReportesPage from "./pages/reportes-page"
import AlertasPage from "./pages/alertas-page"

function App() {
  const [activeNav, setActiveNav] = useState("inicio")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const renderPage = () => {
    switch (activeNav) {
      case "barriles":
        return <BarrelsPage />
      case "movimientos":
        return <MovimientosPage />
      case "escanear":
        return <EscanearPage />
      case "historial":
        return <HistorialPage />
      case "reportes":
        return <ReportesPage />
      case "alertas":
        return <AlertasPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {renderPage()}
    </Layout>
  )
}

export default App
