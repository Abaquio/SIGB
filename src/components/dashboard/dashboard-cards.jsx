"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgePlus as Barrels, TrendingUp, AlertCircle, BarChart3 } from "lucide-react"

const API_BASE = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "")

async function fetchJSON(path, { signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

function toCLP(value) {
  const n = Number(value || 0)
  try {
    return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
  } catch {
    return `$${Math.round(n).toLocaleString("es-CL")}`
  }
}

function pad2(n) {
  return String(n).padStart(2, "0")
}

function getLocalDayRangeISO() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getLocalYYYYMMDD(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export default function DashboardCards() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const [barrilesCount, setBarrilesCount] = useState(0)
  const [movHoyCount, setMovHoyCount] = useState(0)
  const [alertasHoyCount, setAlertasHoyCount] = useState(0)
  const [ventasHoyTotal, setVentasHoyTotal] = useState(0)

  useEffect(() => {
    const ac = new AbortController()

    async function run() {
      try {
        setLoading(true)
        setErr(null)

        const { start, end } = getLocalDayRangeISO()
        const diaStr = getLocalYYYYMMDD(new Date())

        // 1) barriles activos
        const barriles = await fetchJSON(`/api/barriles`, { signal: ac.signal })
        const activos = Array.isArray(barriles) ? barriles.filter((b) => b?.activo !== false) : []
        setBarrilesCount(activos.length)

        // 2) movimientos (hoy)
        const movimientos = await fetchJSON(`/api/movimientos`, { signal: ac.signal })
        const movList = Array.isArray(movimientos) ? movimientos : []
        const hoy = movList.filter((m) => {
          const t = m?.fecha_hora ? new Date(m.fecha_hora) : null
          if (!t || Number.isNaN(t.getTime())) return false
          return t >= start && t <= end
        })
        setMovHoyCount(hoy.length)

        // 3) alertas (hoy) via reportes
        // Si tu tabla alertas no existe o no se usa, esto devolverá error.
        // Lo capturamos y lo dejamos en 0 sin romper el dashboard.
        try {
          const rep = await fetchJSON(`/api/reportes/diario?fecha=${diaStr}`, { signal: ac.signal })
          const totalAlertas = Number(rep?.total_alertas || 0)
          setAlertasHoyCount(totalAlertas)
        } catch {
          setAlertasHoyCount(0)
        }

        // 4) ventas (hoy)
        const desde = new Date(start).toISOString()
        const hasta = new Date(end).toISOString()
        const ventas = await fetchJSON(`/api/ventas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`, {
          signal: ac.signal,
        })
        const vList = Array.isArray(ventas) ? ventas : []
        const total = vList.reduce((s, v) => s + Number(v?.total_neto ?? v?.total_bruto ?? 0), 0)
        setVentasHoyTotal(total)
      } catch (e) {
        setErr(e?.message || "Error cargando dashboard")
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => ac.abort()
  }, [])

  const cards = useMemo(() => {
    return [
      {
        title: "Barriles Activos",
        value: loading ? "—" : String(barrilesCount),
        icon: Barrels,
        color: "from-blue-600 to-blue-400",
        subtext: err ? "Error cargando datos" : "Activos en sistema",
      },
      {
        title: "Movimientos (Hoy)",
        value: loading ? "—" : String(movHoyCount),
        icon: TrendingUp,
        color: "from-purple-600 to-purple-400",
        subtext: err ? "Error cargando datos" : "Registros del día",
      },
      {
        title: "Alertas (Hoy)",
        value: loading ? "—" : String(alertasHoyCount),
        icon: AlertCircle,
        color: "from-orange-600 to-orange-400",
        subtext: alertasHoyCount > 0 ? "Revisar reporte diario" : "Sin alertas",
      },
      {
        title: "Ventas Hoy",
        value: loading ? "—" : toCLP(ventasHoyTotal),
        icon: BarChart3,
        color: "from-green-600 to-green-400",
        subtext: "Total neto del día",
      },
    ]
  }, [loading, err, barrilesCount, movHoyCount, alertasHoyCount, ventasHoyTotal])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold text-accent mt-2">{card.value}</h3>
              </div>
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${card.color} text-white group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{card.subtext}</p>
          </div>
        )
      })}
    </div>
  )
}
