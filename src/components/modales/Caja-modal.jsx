"use client"

import { useEffect, useMemo, useState } from "react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function getUsuarioFromLS() {
  try {
    const keys = ["usuario", "usuarioActual", "user", "session", "auth"]
    for (const k of keys) {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (parsed?.usuario) return parsed.usuario
      if (parsed?.user) return parsed.user
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function getRolName(usuario) {
  const r = usuario?.rol || usuario?.role || usuario?.rol_nombre || ""
  return String(r || "").trim().toUpperCase()
}

export default function CajaModal({ isOpen, onClose, onCajaChange }) {
  const [loading, setLoading] = useState(false)
  const [cajaActual, setCajaActual] = useState(null)
  const [error, setError] = useState("")

  const [montoInicial, setMontoInicial] = useState("")
  const [montoFinalManual, setMontoFinalManual] = useState("")
  const [obs, setObs] = useState("")

  const [resumen, setResumen] = useState(null)
  const [barrilesLiberados, setBarrilesLiberados] = useState(null)

  const usuario = useMemo(() => getUsuarioFromLS(), [isOpen])
  const rol = useMemo(() => getRolName(usuario), [usuario])

  const puedeCaja = rol === "ADMIN" || rol === "VENDEDOR"

  const isCajaAbierta = String(cajaActual?.estado || "").trim().toUpperCase() === "ABIERTA"

  // ✅ Parse robusto: si el body viene vacío, lo tratamos como null (SIN ERROR)
  const safeReadJson = async (res) => {
    const txt = await res.text()
    if (!txt || !txt.trim()) return null
    try {
      return JSON.parse(txt)
    } catch {
      return null
    }
  }

  const fetchCajaActual = async () => {
    try {
      setError("")
      const res = await fetch(`${API_BASE_URL}/api/caja/actual`)

      // Si el server responde 204, no hay contenido => no hay caja abierta
      if (res.status === 204) {
        setCajaActual(null)
        return null
      }

      // Si responde error real
      if (!res.ok) {
        // intentamos leer mensaje
        const data = await safeReadJson(res)
        throw new Error(data?.error || "Error obteniendo caja")
      }

      // OK: leemos body (puede venir vacío)
      const data = await safeReadJson(res)
      const abierta = data && String(data?.estado || "").trim().toUpperCase() === "ABIERTA"
      setCajaActual(abierta ? data : null)
      return abierta ? data : null
    } catch (e) {
      // ✅ Solo mostramos error si es un fallo real de red/servidor
      setCajaActual(null)
      setError(e?.message || "No se pudo obtener la caja actual.")
      return null
    }
  }

  const fetchResumen = async (cajaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/caja/resumen?caja_id=${Number(cajaId)}`)
      if (res.status === 204) return null
      if (!res.ok) return null
      const data = await safeReadJson(res)
      setResumen(data || null)
      return data || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (!isOpen) return
    setResumen(null)
    setBarrilesLiberados(null)
    setError("")

    ;(async () => {
      const caja = await fetchCajaActual()
      if (caja?.id) await fetchResumen(caja.id)
    })()
  }, [isOpen])

  // Polling solo si hay caja abierta
  useEffect(() => {
    if (!isOpen) return
    if (!isCajaAbierta || !cajaActual?.id) return

    const t = setInterval(() => {
      fetchResumen(cajaActual.id)
    }, 1500)

    return () => clearInterval(t)
  }, [isOpen, isCajaAbierta, cajaActual?.id])

  const montoFinalCalculado = useMemo(() => {
    const mi = Number(cajaActual?.monto_inicial || 0)
    const tn = Number(resumen?.total_neto || 0)
    return Number((mi + tn).toFixed(2))
  }, [cajaActual?.monto_inicial, resumen?.total_neto])

  const abrirCaja = async () => {
    if (!puedeCaja) return
    try {
      setLoading(true)
      setError("")
      setBarrilesLiberados(null)

      const payload = {
        usuario_id: usuario?.id ?? null,
        monto_inicial: Number(montoInicial || 0),
        observaciones: obs || null,
      }

      const res = await fetch(`${API_BASE_URL}/api/caja/abrir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await safeReadJson(res)

      if (!res.ok) {
        setError(data?.error || "No se pudo abrir caja.")
        return
      }

      setCajaActual(data)
      onCajaChange?.(data)

      if (data?.id) await fetchResumen(data.id)
    } catch (e) {
      setError(e?.message || "Error abriendo caja.")
    } finally {
      setLoading(false)
    }
  }

  const cerrarCaja = async () => {
    if (!puedeCaja) return
    try {
      setLoading(true)
      setError("")

      if (!cajaActual?.id) {
        setError("No hay caja ABIERTA para cerrar.")
        return
      }

      const payload = {
        usuario_id: usuario?.id ?? null,
        // ✅ si no escriben monto final, cerramos con el calculado
        monto_final:
          montoFinalManual === ""
            ? montoFinalCalculado
            : Number(montoFinalManual),
        observaciones: obs || null,
      }

      const res = await fetch(`${API_BASE_URL}/api/caja/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await safeReadJson(res)

      if (!res.ok) {
        setError(data?.error || "No se pudo cerrar caja.")
        return
      }

      setCajaActual(null)
      setResumen(data?.resumen || null)
      setBarrilesLiberados(data?.resumen?.barriles_liberados ?? data?.barriles_liberados ?? null)
      onCajaChange?.(null)
    } catch (e) {
      setError(e?.message || "Error cerrando caja.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl mx-4 p-6 md:p-8 animate-in zoom-in duration-300">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-accent">Caja</h2>
            <p className="text-foreground/70 text-sm mt-1">
              Abrir/cerrar caja y resumen del turno (totales en vivo).
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-foreground hover:text-accent transition-colors text-2xl leading-none"
            title="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        {!puedeCaja ? (
          <div className="p-4 bg-secondary border border-border rounded-lg text-sm text-foreground/80">
            Tu rol no tiene permisos para gestionar caja (solo ADMIN y VENDEDOR).
            <div className="mt-2 text-xs text-foreground/60">
              Rol detectado: <span className="font-semibold">{rol || "(vacío)"}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-secondary border border-border rounded-lg mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Estado:{" "}
                    <span className={isCajaAbierta ? "text-sidebar-primary" : "text-foreground/70"}>
                      {isCajaAbierta ? "ABIERTA" : "CERRADA"}
                    </span>
                  </p>

                  {cajaActual?.fecha_apertura ? (
                    <p className="text-xs text-foreground/70">
                      Apertura: {new Date(cajaActual.fecha_apertura).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs text-foreground/70">
                      No hay caja abierta actualmente.
                    </p>
                  )}
                </div>

                {cajaActual?.id ? (
                  <span className="text-xs px-3 py-1 rounded-full border border-sidebar-primary text-sidebar-primary">
                    Caja #{cajaActual.id}
                  </span>
                ) : null}
              </div>
            </div>

            {/* ✅ Importante: solo mostrar error si realmente hubo error (no cuando la caja es null “normal”) */}
            {error ? (
              <div className="p-3 mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                {error}
              </div>
            ) : null}

            {isCajaAbierta ? (
              <div className="p-4 bg-secondary border border-border rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Resumen en vivo (día)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-foreground/70">Ventas</p>
                    <p className="text-lg font-bold text-foreground">
                      {resumen?.cantidad_ventas ?? 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-foreground/70">Total neto</p>
                    <p className="text-lg font-bold text-foreground">
                      ${Number(resumen?.total_neto || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-foreground/70">Monto final (calculado)</p>
                    <p className="text-lg font-bold text-foreground">
                      ${Number(montoFinalCalculado || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  {resumen?.por_metodo ? (
                    <div className="text-sm text-foreground/80 space-y-1">
                      {Object.entries(resumen.por_metodo).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span>{k}</span>
                          <span>
                            {Number(v?.ventas || 0)} venta(s) — $
                            {Number(v?.total_neto || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/60">Cargando resumen por método...</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monto inicial</label>
                <input
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  type="number"
                  placeholder="0"
                  disabled={isCajaAbierta}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Monto final (en vivo)</label>
                <input
                  value={isCajaAbierta ? String(montoFinalCalculado || 0) : "0"}
                  readOnly
                  disabled
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary disabled:opacity-60"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Observaciones (opcional)</label>
                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Notas del turno..."
                  className="w-full min-h-[90px] px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-5">
              {!isCajaAbierta ? (
                <button
                  onClick={abrirCaja}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
                >
                  {loading ? "Abriendo..." : "Abrir caja"}
                </button>
              ) : (
                <button
                  onClick={cerrarCaja}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
                >
                  {loading ? "Cerrando..." : "Cerrar caja"}
                </button>
              )}

              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>

            {barrilesLiberados !== null ? (
              <div className="mt-4 text-xs text-foreground/70">
                Barriles liberados al cierre:{" "}
                <span className="font-semibold">{barrilesLiberados}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
