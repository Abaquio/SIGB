"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, ArrowRight } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

function getCategoriaMovimiento(tipoRaw) {
  const t = (tipoRaw || "").toUpperCase()

  if (t.includes("CREAR") || t.includes("ALTA") || t.includes("REACTIVAR")) return "CREACION"
  if (t.includes("ELIMINAR") || t.includes("DESACTIVAR") || t.includes("BAJA")) return "ELIMINACION"
  if (t.includes("ACTUALIZAR") || t.includes("CAMBIO_UBICACION") || t.includes("CAMBIO_ESTADO")) return "ACTUALIZACION"

  return "OTRO"
}

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

export default function ReportesWidget() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [movimientos, setMovimientos] = useState([])

  useEffect(() => {
    const ac = new AbortController()

    async function run() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE_URL}/api/movimientos`, { signal: ac.signal })
        if (!res.ok) throw new Error("No se pudo cargar movimientos para reporte")

        const data = await res.json()
        setMovimientos(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
        if (String(e?.name).toLowerCase() === "aborterror") return
        setError(e?.message || "No se pudo cargar el reporte")
        setMovimientos([])
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => ac.abort()
  }, [])

  const resumen = useMemo(() => {
    const today = startOfDay(new Date())
    const start = addDays(today, -29)

    const last30 = movimientos.filter((m) => {
      const dt = m?.fecha_hora ? new Date(m.fecha_hora) : null
      if (!dt || Number.isNaN(dt.getTime())) return false
      return dt >= start
    })

    let creacion = 0
    let actualizacion = 0
    let eliminacion = 0

    for (const mov of last30) {
      const cat = getCategoriaMovimiento(mov.tipo_movimiento)
      if (cat === "CREACION") creacion++
      if (cat === "ACTUALIZACION") actualizacion++
      if (cat === "ELIMINACION") eliminacion++
    }

    return {
      total_movimientos: last30.length,
      total_alertas: 0, // si luego conectas una tabla/endpoint de alertas, lo sumamos acá
      chartData: [{ name: "Último mes", creacion, actualizacion, eliminacion }],
    }
  }, [movimientos])

  return (
    <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-accent flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Reporte (último mes)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "Cargando..." : error ? error : "Resumen últimos 30 días"}
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/reportes")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs hover:bg-secondary"
        >
          Ir a reportes <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-secondary rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">Movimientos</p>
          <p className="text-2xl font-bold text-accent mt-1">{loading ? "—" : resumen.total_movimientos}</p>
        </div>
        <div className="bg-secondary rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">Alertas</p>
          <p className="text-2xl font-bold text-accent mt-1">{loading ? "—" : resumen.total_alertas}</p>
        </div>
        <div className="bg-secondary rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground">Estado</p>
          <p className="text-sm text-foreground mt-2">{loading ? "Cargando…" : error ? "Sin datos" : "OK"}</p>
        </div>
      </div>

      <div className="mt-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={resumen.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="creacion" name="Creación" fill="#22c55e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="actualizacion" name="Actualización" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            <Bar dataKey="eliminacion" name="Eliminación" fill="#f87171" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
