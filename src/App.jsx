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
import BodegaPage from "./pages/bodega-page"
import POSPage from "./pages/pos-page"
import DevolucionPage from "./pages/devolucion-page"
import StaffPage from "./pages/staff-page"
import LoginPage from "./pages/login"

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // ====== SESIÓN (usuario) ======
  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = localStorage.getItem("usuario")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const handleLogout = () => {
    try {
      localStorage.removeItem("usuario")
    } catch {
      // ignore
    }
    setUsuario(null)
    navigate("/login", { replace: true })
  }

  // ====== NAV / SIDEBAR ======

  // URL -> id de nav
  const pathToNav = (path) => {
    switch (path) {
      case "/":
      case "/inicio":
        return "inicio"
      case "/pos":
        return "pos"
      case "/devoluciones":
        return "devoluciones"
      case "/barriles":
        return "barriles"
      case "/bodegas":
        return "bodegas"
      case "/movimientos":
        return "movimientos"
      case "/escanear":
        return "escanear"
      case "/historial":
      case "/historial-ventas":
        return "historial-ventas"
      case "/reportes":
        return "reportes"
      case "/alertas":
        return "alertas"
      case "/staff":
        return "staff"
      default:
        return "inicio"
    }
  }

  // id de nav -> URL
  const navToPath = (nav) => {
    switch (nav) {
      case "inicio":
        return "/inicio"
      case "pos":
        return "/pos"
      case "devoluciones":
        return "/devoluciones"
      case "barriles":
        return "/barriles"
      case "bodegas":
        return "/bodegas"
      case "movimientos":
        return "/movimientos"
      case "escanear":
        return "/escanear"
      case "historial":
      case "historial-ventas":
        return "/historial-ventas"
      case "reportes":
        return "/reportes"
      case "alertas":
        return "/alertas"
      case "staff":
        return "/staff"
      default:
        return "/inicio"
    }
  }

  // Estado inicial según URL
  const [activeNav, setActiveNav] = useState(() => pathToNav(location.pathname))

  // Sidebar responsivo
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true
    return window.innerWidth >= 768
  })

  // Cuando cambia la URL, sincronizamos el nav (solo cuando no estamos en /login)
  useEffect(() => {
    if (location.pathname === "/login") return
    const nav = pathToNav(location.pathname)
    if (nav !== activeNav) {
      setActiveNav(nav)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Cuando cambia el nav, navegamos a la ruta correspondiente
  useEffect(() => {
    // Si no hay usuario o estamos en login, no forzamos navegación
    if (!usuario) return
    if (location.pathname === "/login") return

    const path = navToPath(activeNav)
    if (location.pathname !== path) {
      navigate(path, { replace: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav, usuario, location.pathname])

  // En mobile, al cambiar de sección se cierra el sidebar
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [activeNav])

  // Listener de resize para manejar el sidebar en desktop/mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ====== QUÉ PÁGINA RENDERIZAR ======
  const renderPage = () => {
    switch (activeNav) {
      case "pos":
        return <POSPage />
      case "devoluciones":
        return <DevolucionPage />
      case "barriles":
        return <BarrelsPage />
      case "bodegas":
        return <BodegaPage />
      case "movimientos":
        return <MovimientosPage />
      case "escanear":
        return <EscanearPage />
      case "historial":
      case "historial-ventas":
        return <HistorialPage />
      case "reportes":
        return <ReportesPage />
      case "alertas":
        return <AlertasPage />
      case "staff":
        return <StaffPage />
      case "inicio":
      default:
        return <Dashboard />
    }
  }

  // ====== RENDER SEGÚN SESIÓN ======

  // Si NO hay usuario → siempre mostramos login, sin Layout ni sidebar
  if (!usuario) {
    return <LoginPage setUsuario={setUsuario} />
  }

  // Si hay usuario → app normal con layout
  return (
    <Layout
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  )
}

export default App
