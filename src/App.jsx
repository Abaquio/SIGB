import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

// Layout y páginas
import Layout from "./components/layout/layout"
import Dashboard from "./components/dashboard/dashboard"

import BarrelsPage from "./pages/barriles-page"
import MovimientosPage from "./pages/movimientos-page"
import EscanearPage from "./pages/escanear-page"
import HistorialPage from "./pages/historial-page"
import ReportesPage from "./pages/reportes-page"
import AlertasPage from "./pages/alertas-page"

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Mapea path → clave de navegación
  const pathToNav = (path) => {
    switch (path) {
      case "/":
      case "/inicio":
        return "inicio"
      case "/barriles":
        return "barriles"
      case "/movimientos":
        return "movimientos"
      case "/escanear":
        return "escanear"
      case "/historial":
        return "historial"
      case "/reportes":
        return "reportes"
      case "/alertas":
        return "alertas"
      default:
        return "inicio"
    }
  }

  // Mapea clave de navegación → path
  const navToPath = (nav) => {
    switch (nav) {
      case "inicio":
        return "/inicio"
      case "barriles":
        return "/barriles"
      case "movimientos":
        return "/movimientos"
      case "escanear":
        return "/escanear"
      case "historial":
        return "/historial"
      case "reportes":
        return "/reportes"
      case "alertas":
        return "/alertas"
      default:
        return "/inicio"
    }
  }

  // Estado inicial basado en la URL actual
  const [activeNav, setActiveNav] = useState(() => pathToNav(location.pathname))

  // Sidebar: según ancho inicial de la ventana
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true
    return window.innerWidth >= 768
  })

  // Sincronizar activeNav cuando cambia la URL (ej: usuario escribe /barriles)
  useEffect(() => {
    const nav = pathToNav(location.pathname)
    if (nav !== activeNav) {
      setActiveNav(nav)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Actualizar URL cuando cambia activeNav desde el sidebar
  useEffect(() => {
    const path = navToPath(activeNav)
    if (location.pathname !== path) {
      navigate(path, { replace: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav])

  // 👉 Al cambiar de sección, si estamos en mobile (<768px), cerramos el sidebar
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [activeNav])

  // 👉 Listener de resize: en desktop siempre mostramos sidebar, en mobile lo ocultamos
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // Llamada inicial por si algo cambió antes de montar
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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
