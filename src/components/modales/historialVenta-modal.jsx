"use client"

import { useEffect, useMemo, useState } from "react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

function formatCLP(n) {
  const val = Number(n || 0)
  try {
    return val.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
  } catch {
    return `$${Math.round(val).toLocaleString("es-CL")}`
  }
}

function toCLDateLabel(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

function toCLDateTimeLabel(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function diaCLToISO(diaCL) {
  // diaCL: "DD-MM-YYYY" => "YYYY-MM-DD"
  const parts = String(diaCL || "").split("-").map((x) => x.trim())
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts
  if (!dd || !mm || !yyyy) return null
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`
}

export default function HistorialVentaModal({ isOpen, onClose, cajaId = null }) {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [limit, setLimit] = useState(50)
  const [query, setQuery] = useState("")

  const [diaSeleccionado, setDiaSeleccionado] = useState(null) // "DD-MM-YYYY"
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  const [exporting, setExporting] = useState(false)

  const fetchVentas = async () => {
    try {
      setLoading(true)
      setError(null)

      // Traemos todas y filtramos en UI (tu tabla ya tiene hartos, limit controla render)
      const res = await fetch(`${API_BASE_URL}/api/ventas`)
      const data = await res.json().catch(() => [])

      if (!res.ok) {
        setVentas([])
        setError(data?.error || "No se pudieron obtener las ventas.")
        return
      }

      setVentas(Array.isArray(data) ? data : [])
    } catch (e) {
      setError("No se pudieron obtener las ventas.")
      setVentas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    fetchVentas()
    // reset vista al abrir (sin romper tu UX)
    setDiaSeleccionado(null)
    setVentaSeleccionada(null)
    setQuery("")
  }, [isOpen])

  const ventasFiltradas = useMemo(() => {
    let arr = Array.isArray(ventas) ? [...ventas] : []

    // filtro opcional por caja
    if (cajaId) {
      arr = arr.filter((v) => Number(v?.caja_id) === Number(cajaId))
    }

    const q = query.trim().toLowerCase()
    if (q) {
      arr = arr.filter((v) => {
        const doc = `${v?.tipo_documento || ""} ${v?.numero_documento || ""}`.toLowerCase()
        const pago = String(v?.metodo_pago || "").toLowerCase()
        const estado = String(v?.estado || "").toLowerCase()

        // ✅ usuario + rol (join)
        const userName = String(v?.usuarios?.nombre_completo || "").toLowerCase()
        const userRol = String(v?.usuarios?.rol || "").toLowerCase()

        return (
          doc.includes(q) ||
          pago.includes(q) ||
          estado.includes(q) ||
          userName.includes(q) ||
          userRol.includes(q)
        )
      })
    }

    return arr
  }, [ventas, query, cajaId])

  const ventasPorDia = useMemo(() => {
    const map = new Map() // diaCL => ventas[]
    ventasFiltradas.forEach((v) => {
      const dia = toCLDateLabel(v?.fecha_hora)
      if (!map.has(dia)) map.set(dia, [])
      map.get(dia).push(v)
    })

    const arr = Array.from(map.entries())
    arr.sort((a, b) => {
      const da = a[1]?.[0]?.fecha_hora ? new Date(a[1][0].fecha_hora).getTime() : 0
      const db = b[1]?.[0]?.fecha_hora ? new Date(b[1][0].fecha_hora).getTime() : 0
      return db - da
    })
    return arr
  }, [ventasFiltradas])

  const ventasDelDia = useMemo(() => {
    if (!diaSeleccionado) return []
    const entry = ventasPorDia.find(([dia]) => dia === diaSeleccionado)
    return entry ? entry[1] : []
  }, [ventasPorDia, diaSeleccionado])

  const totalDia = useMemo(() => {
    return ventasDelDia.reduce((s, v) => s + Number(v?.total_neto ?? v?.total_bruto ?? 0), 0)
  }, [ventasDelDia])

  const exportarPDFDia = async (diaCL) => {
    const diaISO = diaCLToISO(diaCL)
    if (!diaISO) {
      setError("No se pudo exportar: formato de día inválido.")
      return
    }

    try {
      setExporting(true)
      const qs = new URLSearchParams()
      qs.set("dia", diaISO)
      if (cajaId) qs.set("caja_id", String(cajaId))

      window.open(`${API_BASE_URL}/api/ventas/pdf-dia?${qs.toString()}`, "_blank", "noopener,noreferrer")
    } finally {
      setExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] animate-in fade-in duration-200">
      {/* Fullscreen container */}
      <div className="w-full h-full bg-card border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 md:px-8 py-5 border-b border-border bg-card">
          <div>
            <h2 className="text-2xl font-bold text-accent">Historial de ventas</h2>
            <p className="text-foreground/70 text-sm mt-1">
              Presiona un día para ver sus ventas. Presiona una venta para ver el detalle.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-foreground hover:text-accent transition-colors text-3xl leading-none"
            title="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 md:px-8 pt-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-xs text-foreground/70">Buscar</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Usuario, rol, documento, número, método, estado..."
                className="w-full mt-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
              />
            </div>

            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-foreground/70">Mostrar</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                onClick={fetchVentas}
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground hover:border-sidebar-primary/70"
                type="button"
              >
                Recargar
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-6 md:px-8 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Col 1: días */}
            <div className="lg:col-span-1 h-full overflow-hidden rounded-xl border border-border bg-secondary/30">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">Días</div>
                <div className="text-xs text-foreground/60">{ventasFiltradas.length} ventas</div>
              </div>

              <div className="h-full overflow-y-auto p-2">
                {loading ? (
                  <div className="p-4 text-sm text-foreground/70">Cargando…</div>
                ) : error ? (
                  <div className="p-4 text-sm text-red-400">{error}</div>
                ) : ventasPorDia.length === 0 ? (
                  <div className="p-4 text-sm text-foreground/70">No hay ventas.</div>
                ) : (
                  <div className="space-y-2">
                    {ventasPorDia.map(([dia, list]) => {
                      const total = list.reduce((s, v) => s + Number(v?.total_neto ?? v?.total_bruto ?? 0), 0)
                      const active = diaSeleccionado === dia
                      return (
                        <button
                          key={dia}
                          onClick={() => {
                            setDiaSeleccionado(dia)
                            setVentaSeleccionada(null)
                          }}
                          className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${
                            active
                              ? "bg-card border-sidebar-primary"
                              : "bg-secondary border-border hover:border-sidebar-primary/60"
                          }`}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <span className="opacity-80">📅</span> {dia}
                              </div>
                              <div className="text-xs text-foreground/60 mt-1">
                                {list.length} ventas
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-foreground/60">Total día</div>
                              <div className="text-sm font-bold text-accent">{formatCLP(total)}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Col 2: ventas del día */}
            <div className="lg:col-span-2 h-full overflow-hidden rounded-xl border border-border bg-secondary/30">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {diaSeleccionado ? `Ventas del ${diaSeleccionado}` : "Selecciona un día"}
                  </div>
                  {diaSeleccionado ? (
                    <div className="text-xs text-foreground/60 mt-1">
                      Total: <span className="font-semibold text-accent">{formatCLP(totalDia)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {diaSeleccionado ? (
                    <button
                      onClick={() => exportarPDFDia(diaSeleccionado)}
                      disabled={exporting}
                      className="px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:border-sidebar-primary/70 disabled:opacity-50"
                      type="button"
                      title="Exportar PDF del día"
                    >
                      {exporting ? "Exportando..." : "Exportar día PDF"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="h-full overflow-y-auto">
                {!diaSeleccionado ? (
                  <div className="p-6 text-sm text-foreground/70">
                    Tip: presiona un día para ver ventas, y una venta para ver detalle.
                  </div>
                ) : ventasDelDia.length === 0 ? (
                  <div className="p-6 text-sm text-foreground/70">No hay ventas ese día.</div>
                ) : (
                  <div className="p-4">
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-secondary/60 border-b border-border">
                            <tr className="text-left text-foreground">
                              <th className="px-4 py-3 font-semibold">Fecha</th>
                              <th className="px-4 py-3 font-semibold">Documento</th>
                              <th className="px-4 py-3 font-semibold">Usuario</th>
                              <th className="px-4 py-3 font-semibold">Pago</th>
                              <th className="px-4 py-3 font-semibold">Total</th>
                              <th className="px-4 py-3 font-semibold">Estado</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-border">
                            {ventasDelDia.slice(0, limit).map((v) => {
                              const active = ventaSeleccionada?.id === v.id

                              const docLabel = `${v?.tipo_documento || "DOC"}${v?.numero_documento ? ` #${v.numero_documento}` : ""}`
                              const pago = String(v?.metodo_pago || "OTRO").toUpperCase()
                              const estado = String(v?.estado || "—").toUpperCase()
                              const total = v?.total_neto ?? v?.total_bruto ?? 0

                              const userName = v?.usuarios?.nombre_completo || (v?.usuario_id ? `Usuario #${v.usuario_id}` : "—")
                              const userRol = String(v?.usuarios?.rol || "—").toUpperCase()

                              return (
                                <tr
                                  key={v.id}
                                  onClick={() => setVentaSeleccionada(active ? null : v)}
                                  className={`cursor-pointer transition-colors ${
                                    active ? "bg-secondary/40" : "hover:bg-secondary/30"
                                  }`}
                                >
                                  <td className="px-4 py-3 text-foreground">
                                    {toCLDateTimeLabel(v?.fecha_hora)}
                                  </td>
                                  <td className="px-4 py-3 text-foreground font-semibold">
                                    {docLabel}
                                  </td>
                                  <td className="px-4 py-3 text-foreground">
                                    {userName} <span className="text-foreground/60">({userRol})</span>
                                  </td>
                                  <td className="px-4 py-3 text-foreground">{pago}</td>
                                  <td className="px-4 py-3 text-foreground font-semibold">
                                    {formatCLP(total)}
                                  </td>
                                  <td className="px-4 py-3 text-foreground">{estado}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Detalle */}
                    {ventaSeleccionada ? (
                      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                          <div className="text-sm font-semibold text-foreground mb-2">Detalle</div>
                          <div className="text-sm text-foreground/80 space-y-1">
                            <div>
                              Bruto: <span className="font-semibold text-foreground">{formatCLP(ventaSeleccionada.total_bruto)}</span>
                            </div>
                            <div>
                              Descuento: <span className="font-semibold text-foreground">{formatCLP(ventaSeleccionada.descuento_total)}</span>
                            </div>
                            <div>
                              Neto: <span className="font-semibold text-foreground">{formatCLP(ventaSeleccionada.total_neto)}</span>
                            </div>
                            <div className="pt-1">
                              Obs: <span className="text-foreground">{ventaSeleccionada.observaciones || "—"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4">
                          <div className="text-sm font-semibold text-foreground mb-2">Ítems</div>
                          <div className="space-y-2">
                            {(ventaSeleccionada?.venta_detalle || ventaSeleccionada?.items || []).length === 0 ? (
                              <div className="text-sm text-foreground/70">Sin ítems.</div>
                            ) : (
                              (ventaSeleccionada.venta_detalle || ventaSeleccionada.items).map((it, idx) => (
                                <div
                                  key={`${it?.barril_id || idx}-${idx}`}
                                  className="rounded-lg border border-border bg-secondary/40 p-3 flex items-center justify-between"
                                >
                                  <div className="text-sm text-foreground">
                                    <div className="font-semibold">Barril #{it?.barril_id ?? "—"}</div>
                                    <div className="text-xs text-foreground/60">
                                      {it?.cantidad ?? 0} {String(it?.unidad || "").toUpperCase()} • {formatCLP(it?.precio_unitario ?? 0)}
                                    </div>
                                  </div>

                                  <div className="text-sm font-bold text-foreground">
                                    {formatCLP(it?.subtotal ?? (Number(it?.cantidad || 0) * Number(it?.precio_unitario || 0)))}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-4 border-t border-border bg-card flex items-center justify-between">
          <div className="text-xs text-foreground/60">
            Tip: presiona el día para ver ventas, y una venta para ver detalle.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground hover:border-sidebar-primary/70"
            type="button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
