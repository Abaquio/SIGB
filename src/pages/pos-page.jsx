"use client"

import { useEffect, useMemo, useState } from "react"
import PosVentaModal from "../components/modales/posVenta-modal"
import ValidadoCard from "../components/ui/validado"
import EleccionBarrilesModal from "../components/modales/EleccionBarriles-modal"
import CajaModal from "../components/modales/Caja-modal"
import HistorialVentaModal from "../components/modales/historialVenta-modal"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

const PRECIOS_SHOP = { "500": 2000, "1000": 3500 }

const metodosPago = [
  { id: "boleta", nombre: "Boleta", icono: "🧾" },
  { id: "factura", nombre: "Factura", icono: "📄" },
  { id: "transferencia", nombre: "Transferencia", icono: "💸" },
  { id: "tarjeta", nombre: "Tarjeta", icono: "💳" },
]

function getUsuarioLS() {
  try {
    const raw = localStorage.getItem("usuario")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function isCajaAbierta(caja) {
  return String(caja?.estado || "").trim().toUpperCase() === "ABIERTA"
}

export default function POSPage() {
  const usuario = useMemo(() => getUsuarioLS(), [])

  const [barriles, setBarriles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [carrito, setCarrito] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [qrInput, setQrInput] = useState("")
  const [shotSize, setShotSize] = useState("500")

  const [showBoleta, setShowBoleta] = useState(false)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState("boleta")

  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0)
  const [descuentoMonto, setDescuentoMonto] = useState(0)

  const [numeroBoleta, setNumeroBoleta] = useState(null)
  const [cargandoNumeroBoleta, setCargandoNumeroBoleta] = useState(false)

  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState("")

  // Caja
  const [cajaActual, setCajaActual] = useState(null)
  const [showCajaModal, setShowCajaModal] = useState(false)

  // Barriles selección
  const [showEleccionModal, setShowEleccionModal] = useState(false)
  const [selectedBarriles, setSelectedBarriles] = useState([])

  const [showHistorialModal, setShowHistorialModal] = useState(false)

  // =========================================
  // ✅ Eventos desde TopBar (súper robusto)
  // =========================================
  useEffect(() => {
    const openCaja = () => setShowCajaModal(true)
    const openBarriles = () => setShowEleccionModal(true)
    const openHistorial = () => setShowHistorialModal(true)

    window.addEventListener("open-caja-modal", openCaja)
    window.addEventListener("open-barriles-modal", openBarriles)
    window.addEventListener("open-historial-ventas", openHistorial)

    window.__openCajaModal = openCaja
    window.__openBarrilesModal = openBarriles
    window.__openHistorialVentasModal = openHistorial

    return () => {
      window.removeEventListener("open-caja-modal", openCaja)
      window.removeEventListener("open-barriles-modal", openBarriles)
      window.removeEventListener("open-historial-ventas", openHistorial)
      try {
        delete window.__openCajaModal
        delete window.__openBarrilesModal
        delete window.__openHistorialVentasModal
      } catch {}
    }
  }, [])

  // =========================================
  // API
  // =========================================
  const fetchCajaActual = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/caja/actual`)
      if (!res.ok) {
        setCajaActual(null)
        return null
      }
      const data = await res.json()

      const caja = data && isCajaAbierta(data) ? data : null

      setCajaActual(caja)
      return caja
    } catch {
      setCajaActual(null)
      return null
    }
  }

  const fetchBarriles = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/barriles`)
      if (!res.ok) {
        const raw = await res.text()
        console.error("Error /api/barriles:", res.status, raw)
        throw new Error("Error al cargar barriles")
      }

      const data = await res.json()
      setBarriles(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setError("No se pudieron cargar los barriles.")
    } finally {
      setLoading(false)
    }
  }

  // Init
  useEffect(() => {
    ;(async () => {
      await fetchCajaActual()
      await fetchBarriles()
    })()
  }, [])

  // Si hay caja abierta => EN_USO es la selección activa del turno
  useEffect(() => {
    if (!cajaActual?.id) {
      setSelectedBarriles([])
      return
    }
    const enUso = barriles.filter(
      (b) => String(b.estado_actual || "").trim().toUpperCase() === "EN_USO"
    )
    setSelectedBarriles(enUso)
  }, [barriles, cajaActual?.id])

  // Modal lista: DISPONIBLE + EN_USO
  const barrilesElegibles = useMemo(() => {
    return barriles.filter((b) => {
      const est = String(b.estado_actual || "").trim().toUpperCase()
      return est === "DISPONIBLE" || est === "EN_USO"
    })
  }, [barriles])

  const barrilesParaVenta = useMemo(
    () => (selectedBarriles.length ? selectedBarriles : []),
    [selectedBarriles]
  )

  // API caja barriles
  const asignarBarriles = async (ids) => {
    const res = await fetch(`${API_BASE_URL}/api/caja/barriles/asignar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barril_ids: ids, usuario_id: usuario?.id ?? null }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error || "No se pudo asignar barriles")
    return true
  }

  const liberarBarriles = async (ids) => {
    const res = await fetch(`${API_BASE_URL}/api/caja/barriles/liberar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barril_ids: ids, usuario_id: usuario?.id ?? null }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error || "No se pudo liberar barriles")
    return true
  }

  const handleConfirmSeleccion = async (nuevosSeleccionados) => {
    setShowEleccionModal(false)

    if (!cajaActual?.id) {
      setConfirmMessage("Debes abrir caja antes de seleccionar barriles.")
      setShowConfirm(true)
      return
    }

    const prevIds = new Set(selectedBarriles.map((b) => b.id))
    const newIds = new Set((nuevosSeleccionados || []).map((b) => b.id))

    const toAssign = []
    const toRelease = []

    for (const id of newIds) if (!prevIds.has(id)) toAssign.push(id)
    for (const id of prevIds) if (!newIds.has(id)) toRelease.push(id)

    try {
      if (toAssign.length) await asignarBarriles(toAssign)
      if (toRelease.length) await liberarBarriles(toRelease)

      await fetchBarriles()

      setConfirmMessage(
        `Selección actualizada. Asignados: ${toAssign.length} — Liberados: ${toRelease.length}.`
      )
      setShowConfirm(true)
    } catch (e) {
      setConfirmMessage(e?.message || "Error actualizando selección.")
      setShowConfirm(true)
    }
  }

  // =========================================
  // Carrito
  // =========================================
  const handleAgregarAlCarrito = (barril) => {
    const precioShop = PRECIOS_SHOP[shotSize]
    setCarrito((prev) => {
      const idx = prev.findIndex(
        (it) => it.id === barril.id && it.shotSize === shotSize
      )
      if (idx !== -1) {
        const copia = [...prev]
        copia[idx] = { ...copia[idx], cantidadShops: copia[idx].cantidadShops + 1 }
        return copia
      }
      return [...prev, { ...barril, cantidadShops: 1, shotSize, precioShop }]
    })
  }

  const cambiarCantidad = (id, nueva, shot) => {
    if (nueva < 1) return
    setCarrito((prev) =>
      prev.map((it) =>
        it.id === id && it.shotSize === shot ? { ...it, cantidadShops: nueva } : it
      )
    )
  }

  const handleEliminarDelCarrito = (id, shot) => {
    setCarrito((prev) => prev.filter((it) => !(it.id === id && it.shotSize === shot)))
  }

  // Buscar QR / texto (solo con caja + EN_USO)
  const handleBuscarPorQR = () => {
    if (!cajaActual?.id) return alert("Debes abrir caja para operar el POS.")
    if (!barrilesParaVenta.length)
      return alert("Primero selecciona barriles en 'Elección de barriles'.")

    const qr = qrInput.trim().toLowerCase()
    if (!qr) return

    const found = barrilesParaVenta.find((b) => (b.codigo_qr || "").toLowerCase() === qr)
    if (!found) return alert("Barril no encontrado en tu selección.")

    handleAgregarAlCarrito(found)
    setQrInput("")
  }

  const handleBuscarPorNombre = () => {
    if (!cajaActual?.id) return alert("Debes abrir caja para operar el POS.")
    if (!barrilesParaVenta.length)
      return alert("Primero selecciona barriles en 'Elección de barriles'.")

    const term = searchTerm.trim().toLowerCase()
    if (!term) return

    const found = barrilesParaVenta.find((b) => {
      const nombre = (b.tipo_cerveza || "").toLowerCase()
      const codigo = (b.codigo_interno || "").toLowerCase()
      const qr = (b.codigo_qr || "").toLowerCase()
      const ubic = (b.ubicacion_actual || "").toLowerCase()
      return nombre.includes(term) || codigo.includes(term) || qr.includes(term) || ubic.includes(term)
    })

    if (!found) return alert("Barril no encontrado en tu selección.")
    handleAgregarAlCarrito(found)
    setSearchTerm("")
  }

  // =========================================
  // ✅ Totales + límites de descuento
  // =========================================
  const subtotal = carrito.reduce(
    (s, it) => s + (it.precioShop || 0) * (it.cantidadShops || 0),
    0
  )

  // porcentaje 0..100
  const pctSafe = Math.min(100, Math.max(0, Number(descuentoPorcentaje) || 0))
  const descPctCalc = pctSafe > 0 ? (subtotal * pctSafe) / 100 : 0

  // monto no puede superar lo que queda luego del %
  const maxMontoPermitido = Math.max(0, subtotal - descPctCalc)
  const montoSafe = Math.min(maxMontoPermitido, Math.max(0, Number(descuentoMonto) || 0))

  const desc1 = descPctCalc
  const desc2 = montoSafe

  const total = Math.max(0, subtotal - desc1 - desc2)

  // ✅ si se cambia el % y el monto quedó pasado, lo ajustamos automáticamente
  useEffect(() => {
    const pctN = Math.min(100, Math.max(0, Number(descuentoPorcentaje) || 0))
    if (pctN !== descuentoPorcentaje) setDescuentoPorcentaje(pctN)

    const descPct = pctN > 0 ? (subtotal * pctN) / 100 : 0
    const maxMonto = Math.max(0, subtotal - descPct)

    const montoN = Math.max(0, Number(descuentoMonto) || 0)
    if (montoN > maxMonto) setDescuentoMonto(maxMonto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descuentoPorcentaje, subtotal])

  // ✅ si se cambia el monto y se pasa, se ajusta
  useEffect(() => {
    const pctN = Math.min(100, Math.max(0, Number(descuentoPorcentaje) || 0))
    const descPct = pctN > 0 ? (subtotal * pctN) / 100 : 0
    const maxMonto = Math.max(0, subtotal - descPct)

    const montoN = Math.max(0, Number(descuentoMonto) || 0)
    if (montoN > maxMonto) setDescuentoMonto(maxMonto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descuentoMonto, subtotal])

  const obtenerNumeroBoleta = async () => {
    try {
      setCargandoNumeroBoleta(true)
      setNumeroBoleta(null)

      const res = await fetch(`${API_BASE_URL}/api/ventas/siguiente-numero`)
      if (!res.ok) throw new Error("Error obteniendo correlativo")
      const data = await res.json()
      setNumeroBoleta(data?.nextNumero ?? 1)
    } catch {
      setNumeroBoleta(1)
    } finally {
      setCargandoNumeroBoleta(false)
      setShowBoleta(true)
    }
  }

  const generarBoleta = () => {
    if (!cajaActual?.id) {
      setConfirmMessage("No hay caja ABIERTA. Debes abrir caja para vender.")
      setShowConfirm(true)
      return
    }
    if (!carrito.length) return alert("El carrito está vacío")
    obtenerNumeroBoleta()
  }

  const finalizarVenta = async () => {
    try {
      if (!cajaActual?.id) {
        setConfirmMessage("No hay caja ABIERTA. Debes abrir caja para vender.")
        setShowConfirm(true)
        return
      }

      if (!carrito.length) return alert("No hay barriles en el carrito.")
      if (!numeroBoleta) return alert("No se pudo obtener el número de boleta.")

      const primerBarril = carrito[0]
      const bodegaId = primerBarril?.bodega_id || null

      const tipoDocumento = metodoPagoSeleccionado === "factura" ? "FACTURA" : "BOLETA"
      const metodoPago =
        metodoPagoSeleccionado === "transferencia"
          ? "TRANSFERENCIA"
          : metodoPagoSeleccionado === "tarjeta"
            ? "DEBITO"
            : "EFECTIVO"

      const descuentoTotal = (desc1 + desc2) || 0

      const items = carrito.map((it) => {
        const litrosPorShop = it.shotSize === "1000" ? 1 : 0.5
        const cantidadLitros = (it.cantidadShops || 1) * litrosPorShop
        const precioShop = it.precioShop || 0
        const precioUnitario = litrosPorShop > 0 ? precioShop / litrosPorShop : precioShop

        return {
          barril_id: it.id,
          cantidad: cantidadLitros,
          unidad: "LITRO",
          precio_unitario: precioUnitario,
        }
      })

      const payload = {
        caja_id: cajaActual.id,
        usuario_id: usuario?.id ?? null,
        cliente_id: null,
        bodega_id: bodegaId,
        tipo_documento: tipoDocumento,
        numero_documento: String(numeroBoleta),
        metodo_pago: metodoPago,
        descuento_total: descuentoTotal,
        observaciones: "Venta POS - BrewMaster",
        items,
      }

      const resp = await fetch(`${API_BASE_URL}/api/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await resp.json().catch(() => null)

      if (!resp.ok) {
        alert(data?.error || "Ocurrió un error al registrar la venta.")
        return
      }

      const ventaId = data?.id ?? null
      if (ventaId) {
        window.open(`${API_BASE_URL}/api/ventas/pdf/${ventaId}`, "_blank", "noopener,noreferrer")
      }

      setConfirmMessage(`Venta registrada correctamente (ID: ${ventaId ?? "OK"}).`)
      setShowConfirm(true)

      setCarrito([])
      setDescuentoMonto(0)
      setDescuentoPorcentaje(0)
      setShowBoleta(false)

      await fetchCajaActual()
      await fetchBarriles()
    } catch {
      alert("Error inesperado al finalizar la venta.")
    }
  }

  const onCajaChange = async (caja) => {
    const cajaAbierta = caja && isCajaAbierta(caja) ? caja : null
    setCajaActual(cajaAbierta)

    if (!cajaAbierta?.id) {
      setCarrito([])
      setShowBoleta(false)
      setNumeroBoleta(null)
      setSelectedBarriles([])
    }

    await fetchCajaActual()
    await fetchBarriles()
  }

  // =========================================
  // Render
  // =========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
            💳 Sistema de Ventas (POS)
          </h1>
          <p className="text-foreground/70 mt-2">
            {cajaActual?.id
              ? `Caja ABIERTA (#${cajaActual.id}). Barriles EN_USO disponibles para vender.`
              : "No hay caja abierta. Abre caja (TopBar → Caja) para vender y seleccionar barriles."}
          </p>
        </div>
      </div>

      {!cajaActual?.id ? (
        <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-foreground/80">
          ⚠️ Para operar el POS debes <span className="font-semibold">abrir caja</span> (TopBar → “Caja”).
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IZQ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Buscar Barril</h2>

            {/* Barriles seleccionados */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Barriles EN_USO (caja)
              </label>

              {selectedBarriles.length === 0 ? (
                <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-foreground/70">
                  No hay barriles EN_USO para esta caja. Usa TopBar → “Elección de barriles”.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {selectedBarriles.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg border bg-secondary text-foreground border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{b.tipo_cerveza || "Barril"}</p>
                          <p className="text-xs text-foreground/70">Código: {b.codigo_interno || "-"}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full border border-sidebar-primary text-sidebar-primary whitespace-nowrap">
                          EN_USO
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Escanear QR (solo EN_USO)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarPorQR()}
                  placeholder="Ingresa código QR..."
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
                />
                <button
                  onClick={handleBuscarPorQR}
                  className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  📱
                </button>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Buscar por texto (solo EN_USO)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarPorNombre()}
                  placeholder="IPA, código, ubicación..."
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
                />
                <button
                  onClick={handleBuscarPorNombre}
                  className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Tamaño */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tamaño del shop</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShotSize("500")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    shotSize === "500"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                      : "bg-secondary text-foreground border-border hover:border-sidebar-primary/70"
                  }`}
                >
                  <span>🍺</span>
                  <span>500 ml — ${PRECIOS_SHOP["500"].toLocaleString()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShotSize("1000")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    shotSize === "1000"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                      : "bg-secondary text-foreground border-border hover:border-sidebar-primary/70"
                  }`}
                >
                  <span>🍻</span>
                  <span>1 L — ${PRECIOS_SHOP["1000"].toLocaleString()}</span>
                </button>
              </div>
            </div>

            {/* Lista EN_USO para vender */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Barriles para vender (EN_USO)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {loading && (
                  <p className="text-sm text-foreground/60 py-4 col-span-full">
                    Cargando barriles...
                  </p>
                )}
                {!loading && error && (
                  <p className="text-sm text-red-400 py-4 col-span-full">{error}</p>
                )}
                {!loading && !error && barrilesParaVenta.length === 0 && (
                  <p className="text-sm text-foreground/60 py-4 col-span-full">
                    Selecciona barriles en TopBar → “Elección de barriles”.
                  </p>
                )}

                {!loading &&
                  !error &&
                  barrilesParaVenta.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleAgregarAlCarrito(b)}
                      className="p-3 rounded-lg border text-left text-sm transition-all bg-secondary text-foreground border-border hover:border-sidebar-primary hover:bg-secondary/80"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{b.tipo_cerveza || "Barril"}</p>
                          <p className="text-xs opacity-80">Código interno: {b.codigo_interno}</p>
                          {b.codigo_qr ? <p className="text-xs opacity-80">QR: {b.codigo_qr}</p> : null}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[11px] uppercase tracking-wide opacity-80">EN_USO</p>
                          <p className="text-[11px] opacity-80 border border-white/10 rounded-full px-2 py-[1px] mt-1">
                            Shop: {shotSize === "1000" ? "1 L" : "500 ml"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* DER */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border h-fit sticky top-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Carrito</h2>

            {carrito.length === 0 ? (
              <p className="text-center text-foreground/50 py-8">El carrito está vacío</p>
            ) : (
              <>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {carrito.map((it) => (
                    <div
                      key={`${it.id}-${it.shotSize}`}
                      className="p-3 bg-secondary rounded-lg border border-border space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-foreground">{it.tipo_cerveza || "Barril"}</p>
                          <p className="text-xs text-foreground/70">Código interno: {it.codigo_interno}</p>
                          <p className="text-xs text-foreground/60 mt-1">
                            Tamaño: {it.shotSize === "1000" ? "1 L" : "500 ml"}
                          </p>
                          <p className="text-xs text-foreground/60">Precio shop: ${it.precioShop.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleEliminarDelCarrito(it.id, it.shotSize)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => cambiarCantidad(it.id, (it.cantidadShops || 1) - 1, it.shotSize)}
                          className="px-2 py-1 bg-secondary border border-border rounded"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">{it.cantidadShops}</span>
                        <button
                          onClick={() => cambiarCantidad(it.id, (it.cantidadShops || 1) + 1, it.shotSize)}
                          className="px-2 py-1 bg-secondary border border-border rounded"
                        >
                          +
                        </button>

                        <span className="ml-auto font-semibold text-foreground text-sm">
                          ${(it.precioShop * it.cantidadShops).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-foreground">Descuento (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={descuentoPorcentaje}
                      onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-foreground">Descuento ($)</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, subtotal - (pctSafe > 0 ? (subtotal * pctSafe) / 100 : 0))}
                      value={descuentoMonto}
                      onChange={(e) => setDescuentoMonto(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground"
                      placeholder="0"
                    />
                    <p className="text-xs text-foreground/50">
                      Máximo permitido: ${maxMontoPermitido.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">Subtotal:</span>
                    <span className="text-foreground font-medium">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">Descuento:</span>
                    <span className="text-foreground font-medium">
                      -${(desc1 + desc2).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-sidebar-primary">${total.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={generarBoleta}
                    className="w-full py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold"
                  >
                    {cargandoNumeroBoleta ? "Generando número..." : "Generar Boleta"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <PosVentaModal
        show={showBoleta}
        carrito={carrito}
        total={total}
        numeroBoleta={numeroBoleta}
        metodoPago={metodoPagoSeleccionado}
        setMetodoPago={setMetodoPagoSeleccionado}
        onClose={() => setShowBoleta(false)}
        onConfirm={finalizarVenta}
        metodosPago={metodosPago}
      />

      <ValidadoCard
        open={showConfirm}
        title="Confirmación"
        message={confirmMessage}
        onClose={() => setShowConfirm(false)}
      />

      <EleccionBarrilesModal
        isOpen={showEleccionModal}
        onClose={() => setShowEleccionModal(false)}
        barriles={barrilesElegibles}
        selectedIds={selectedBarriles.map((b) => b.id)}
        onConfirm={handleConfirmSeleccion}
      />

      <CajaModal
        isOpen={showCajaModal}
        onClose={() => setShowCajaModal(false)}
        onCajaChange={onCajaChange}
      />

      <HistorialVentaModal
        isOpen={showHistorialModal}
        onClose={() => setShowHistorialModal(false)}
        cajaId={cajaActual?.id ?? null}
      />
    </div>
  )
}
