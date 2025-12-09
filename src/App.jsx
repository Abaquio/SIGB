import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

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

  // Estado REAL de sesión
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem("usuario")
    return saved ? JSON.parse(saved) : null
  })

  // Función que Topbar debe usar cuando hace logout
  const handleLogout = () => {
    localStorage.removeItem("usuario")
    setUsuario(null)
    navigate("/login", { replace: true })
  }

  // Rutas protegidas
  const protectedPaths = [
    "/",
    "/inicio",
    "/pos",
    "/devoluciones",
    "/barriles",
    "/bodegas",
    "/movimientos",
    "/escanear",
    "/historial",
    "/reportes",
    "/alertas",
    "/staff",
  ]

  // 🔐 PROTECCIÓN DE RUTAS
  useEffect(() => {
    const path = location.pathname
    const isProtected = protectedPaths.includes(path)

    // Si NO está logueado → SOLO permitir /login
    if (!usuario) {
      if (path !== "/login") {
        navigate("/login", { replace: true })
      }
      return
    }

    // Si está logueado e intenta ir a /login → mandarlo al inicio
    if (usuario && path === "/login") {
      navigate("/inicio", { replace: true })
      return
    }

    // Si está logueado pero ruta NO existe → mandarlo al inicio
    if (!isProtected) {
      navigate("/inicio", { replace: true })
    }
  }, [usuario, location.pathname, navigate])

  // Detectar qué página renderizar
  const renderPage = () => {
    switch (location.pathname) {
      case "/inicio":
      case "/":
        return <Dashboard />
      case "/pos":
        return <POSPage />
      case "/devoluciones":
        return <DevolucionPage />
      case "/barriles":
        return <BarrelsPage />
      case "/bodegas":
        return <BodegaPage />
      case "/movimientos":
        return <MovimientosPage />
      case "/escanear":
        return <EscanearPage />
      case "/historial":
        return <HistorialPage />
      case "/reportes":
        return <ReportesPage />
      case "/alertas":
        return <AlertasPage />
      case "/staff":
        return <StaffPage />
      default:
        return <Dashboard />
    }
  }

  // Si no hay usuario → mostrar solo login
  if (!usuario) {
    return <LoginPage setUsuario={setUsuario} />
  }

  // Si hay usuario → mostrar layout y páginas
  return (
    <Layout onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  )
}

export default App
