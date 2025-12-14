"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const API_BASE = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "")

async function fetchJSON(path, { signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function classifyMovimiento(m) {
  const t = String(m?.tipo_movimiento || "").toUpperCase()

  // Heurísticas basadas en tu backend
  // - "llenado": creación/retorno/activar/entrada
  // - "vaciado": ventas/desactivar/agotar/salida
  if (t.includes("DEVOLUCION") || t.includes("CREAR") || t.includes("REACTIVAR") || t.includes("ENTRADA")) return "llenado"
  if (t.includes("VENTA") || t.includes("DESACTIVAR") || t.includes("AGOTADO") || t.includes("SALIDA")) return "vaciado"
  if (t.includes("CAMBIO_UBICACION") || t.includes("TRANSFER")) return "transferencia"
  return "otro"
}

export default function BarrelsChart() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [movimientos, setMovimientos] = useState([])

  useEffect(() => {
    const ac = new AbortController()
    async function run() {
      try {
        setLoading(true)
        setErr(null)
        const data = await fetchJSON(`/api/movimientos`, { signal: ac.signal })
        setMovimientos(Array.isArray(data) ? data : [])
      } catch (e) {
        setErr("No se pudo cargar movimientos")
        setMovimientos([])
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => ac.abort()
  }, [])

  const data = useMemo(() => {
    const today = startOfDay(new Date())
    const start = addDays(today, -6) // últimos 7 días

    const buckets = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i)
      buckets.push({
        key: d.toISOString().slice(0, 10),
        name: dayNames[d.getDay()],
        llenado: 0,
        vaciado: 0,
        transferencia: 0,
      })
    }

    const map = new Map(buckets.map((b) => [b.key, b]))

    for (const m of movimientos) {
      const dt = m?.fecha_hora ? new Date(m.fecha_hora) : null
      if (!dt || Number.isNaN(dt.getTime())) continue
      const dayKey = startOfDay(dt).toISOString().slice(0, 10)
      const b = map.get(dayKey)
      if (!b) continue

      const cls = classifyMovimiento(m)
      if (cls === "llenado") b.llenado += 1
      else if (cls === "vaciado") b.vaciado += 1
      else if (cls === "transferencia") b.transferencia += 1
    }

    return buckets
  }, [movimientos])

  return (
    <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
      <h3 className="text-xl font-bold text-accent mb-1">Actividad de Barriles</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {loading ? "Cargando..." : err ? err : "Últimos 7 días (según movimientos)"}
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="name" stroke="#a0a0a0" />
          <YAxis stroke="#a0a0a0" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #d4af37",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#d4af37" }}
          />
          <Legend />
          <Bar dataKey="llenado" fill="#d4af37" radius={[8, 8, 0, 0]} />
          <Bar dataKey="vaciado" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          <Bar dataKey="transferencia" fill="#06b6d4" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
