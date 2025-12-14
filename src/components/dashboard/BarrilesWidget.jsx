"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { BadgeX as Barrel, ArrowRight } from "lucide-react"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

function buildChartData(barrels) {
  if (!barrels || barrels.length === 0) return []
  const map = new Map()

  barrels.forEach((b) => {
    const tipo = b.tipo_cerveza || "Sin tipo"
    const capacidad = Number(b.capacidad_litros) || 0

    if (!map.has(tipo)) {
      map.set(tipo, { name: tipo, cantidad: 0, capacidad: 0 })
    }
    const item = map.get(tipo)
    item.cantidad += 1
    item.capacidad += capacidad
  })

  return Array.from(map.values())
}

const getCapacidadPercent = (capacidad, litrosRestantes) => {
  const cap = Number(capacidad) || 0
  const rest = Number(litrosRestantes) || 0
  if (cap <= 0) return 0
  const percent = (rest / cap) * 100
  return Math.max(0, Math.min(100, percent))
}

export default function BarrilesWidget() {
  const [barrels, setBarrels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ac = new AbortController()

    async function run() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE_URL}/api/barriles`, { signal: ac.signal })
        if (!res.ok) throw new Error("Error al obtener barriles")

        const data = await res.json()
        setBarrels(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
        setError("No se pudieron cargar barriles")
        setBarrels([])
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => ac.abort()
  }, [])

  const kpis = useMemo(() => {
    const total = barrels.length
    const disponibles = barrels.filter((b) => String(b.estado_actual || "").toUpperCase() === "DISPONIBLE").length
    const enUso = barrels.filter((b) => String(b.estado_actual || "").toUpperCase() === "EN_USO").length
    const bajoNivel = barrels.filter((b) => getCapacidadPercent(b.capacidad_litros, b.litros_restantes) <= 15).length

    return { total, disponibles, enUso, bajoNivel }
  }, [barrels])

  const chartData = useMemo(() => buildChartData(barrels), [barrels])

  return (
    <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-accent flex items-center gap-2">
            <Barrel className="w-6 h-6" />
            Barriles
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "Cargando..." : error ? error : "Resumen por tipo y estado"}
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/barriles")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs hover:bg-secondary"
        >
          Gestionar <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="bg-secondary rounded-lg p-3 border border-border">
          <p className="text-[11px] text-muted-foreground">Total</p>
          <p className="text-xl font-bold text-accent">{loading ? "—" : kpis.total}</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 border border-border">
          <p className="text-[11px] text-muted-foreground">Disponibles</p>
          <p className="text-xl font-bold text-accent">{loading ? "—" : kpis.disponibles}</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 border border-border">
          <p className="text-[11px] text-muted-foreground">En uso</p>
          <p className="text-xl font-bold text-accent">{loading ? "—" : kpis.enUso}</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 border border-border">
          <p className="text-[11px] text-muted-foreground">Bajo nivel</p>
          <p className="text-xl font-bold text-accent">{loading ? "—" : kpis.bajoNivel}</p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando gráfico…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cantidad" name="Cantidad" stroke="#facc15" strokeWidth={2} />
              <Line type="monotone" dataKey="capacidad" name="Capacidad total (L)" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
