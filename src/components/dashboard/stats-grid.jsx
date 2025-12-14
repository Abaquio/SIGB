"use client"

import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const API_BASE = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "")

async function fetchJSON(path, { signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function pad2(n) {
  return String(n).padStart(2, "0")
}
function dayLabel(d) {
  const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  return names[d.getDay()]
}

export default function StatsGrid() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const [barriles, setBarriles] = useState([])
  const [ventas, setVentas] = useState([])

  useEffect(() => {
    const ac = new AbortController()
    async function run() {
      try {
        setLoading(true)
        setErr(null)

        const now = new Date()
        const desde = startOfDay(addDays(now, -5)) // últimos 6 días
        const hasta = endOfDay(now)

        const [b, v] = await Promise.all([
          fetchJSON(`/api/barriles`, { signal: ac.signal }).catch(() => []),
          fetchJSON(`/api/ventas?desde=${encodeURIComponent(desde.toISOString())}&hasta=${encodeURIComponent(hasta.toISOString())}`, {
            signal: ac.signal,
          }).catch(() => []),
        ])

        setBarriles(Array.isArray(b) ? b : [])
        setVentas(Array.isArray(v) ? v : [])
      } catch {
        setErr("No se pudieron cargar estadísticas")
        setBarriles([])
        setVentas([])
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => ac.abort()
  }, [])

  const qualityData = useMemo(() => {
    // Mapeo “bonito” desde estado_actual real
    const counts = {
      DISPONIBLE: 0,
      EN_USO: 0,
      AGOTADO: 0,
      ELIMINADO: 0,
      OTRO: 0,
    }

    for (const b of barriles) {
      const st = String(b?.estado_actual || "OTRO").toUpperCase()
      if (counts[st] !== undefined) counts[st] += 1
      else counts.OTRO += 1
    }

    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1

    // Colores (mismos que tu estilo)
    const rows = [
      { name: "Disponible", key: "DISPONIBLE", color: "#d4af37" },
      { name: "En uso", key: "EN_USO", color: "#f59e0b" },
      { name: "Agotado", key: "AGOTADO", color: "#ef4444" },
      { name: "Eliminado", key: "ELIMINADO", color: "#7c2d12" },
    ]

    return rows.map((r) => ({
      name: r.name,
      value: Math.round((counts[r.key] / total) * 100),
      color: r.color,
      _raw: counts[r.key],
    }))
  }, [barriles])

  const efficiencyData = useMemo(() => {
    const now = new Date()
    const days = []
    for (let i = 5; i >= 0; i--) {
      const d = startOfDay(addDays(now, -i))
      days.push({ day: dayLabel(d), key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` })
    }

    const map = new Map(days.map((x) => [x.key, { day: x.day, total: 0 }]))

    for (const v of ventas) {
      const dt = v?.fecha_hora ? new Date(v.fecha_hora) : null
      if (!dt || Number.isNaN(dt.getTime())) continue
      const k = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
      const row = map.get(k)
      if (!row) continue
      row.total += Number(v?.total_neto ?? v?.total_bruto ?? 0)
    }

    const arr = days.map((d) => map.get(d.key) || { day: d.day, total: 0 })
    const max = Math.max(...arr.map((x) => x.total), 1)

    return arr.map((x) => ({
      day: x.day,
      efficiency: Math.round((x.total / max) * 100),
    }))
  }, [ventas])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Control de “Calidad” (Estados reales) */}
      <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
        <h3 className="text-xl font-bold text-accent mb-1">Control de Calidad</h3>
        <p className="text-xs text-muted-foreground mb-4">{loading ? "Cargando..." : err ? err : "Distribución por estado de barril"}</p>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={qualityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" startAngle={90} endAngle={450}>
              {qualityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#d4af37" }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2 text-sm">
          {qualityData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">
                {item.name}: {item.value}%{/* (raw: {item._raw}) */}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* “Eficiencia” (Ventas normalizadas) */}
      <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
        <h3 className="text-xl font-bold text-accent mb-1">Eficiencia Semanal</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {loading ? "Cargando..." : err ? err : "Ventas últimos días (escala 0–100)"}
        </p>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="day" stroke="#a0a0a0" />
            <YAxis stroke="#a0a0a0" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#d4af37" }}
            />
            <Line type="monotone" dataKey="efficiency" stroke="#d4af37" strokeWidth={3} dot={{ fill: "#d4af37", r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
