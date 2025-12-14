"use client"

import { useEffect, useMemo, useState } from "react"
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
import { TrendingUp, ArrowRight } from "lucide-react"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

function formatFecha(fechaStr) {
  if (!fechaStr) return "—"
  const d = new Date(fechaStr)
  if (Number.isNaN(d.getTime())) return fechaStr
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getCategoriaMovimiento(tipoRaw) {
  const t = (tipoRaw || "").toUpperCase()

  if (
    t.includes("CREAR_BARRIL") ||
    t.includes("REACTIVAR_BARRIL") ||
    t.includes("ALTA") ||
    t.includes("CREAR")
  ) return "CREACION"

  if (
    t.includes("DESACTIVAR_BARRIL") ||
    t.includes("BAJA") ||
    t.includes("ELIMINAR")
  ) return "ELIMINACION"

  if (
    t.includes("CAMBIO_UBICACION") ||
    t.includes("CAMBIO_ESTADO") ||
    t.includes("ACTUALIZAR")
  ) return "ACTUALIZACION"

  return "OTRO"
}

function getEtiquetaMovimiento(tipoRaw) {
  const cat = getCategoriaMovimiento(tipoRaw)
  if (cat === "CREACION") return "Creación"
  if (cat === "ELIMINACION") return "Eliminación"
  if (cat === "ACTUALIZACION") return "Actualización"
  return "Otro"
}

function pad2(n) {
  return String(n).padStart(2, "0")
}

function toYYYYMMDD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
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

export default function MovimientosWidget() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ac = new AbortController()

    async function fetchMovimientos() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE_URL}/api/movimientos`, { signal: ac.signal })
        if (!res.ok) throw new Error("Error al obtener movimientos")

        const data = await res.json()
        setMovimientos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        // si el abort viene por navegación/hmr, no lo muestres como error feo
        if (String(err?.name).toLowerCase() === "aborterror") return
        setError("No se pudieron cargar movimientos")
        setMovimientos([])
      } finally {
        setLoading(false)
      }
    }

    fetchMovimientos()
    return () => ac.abort()
  }, [])

  // ✅ Chart: últimos 30 días agrupado por DÍA (no por hora)
  const chartData = useMemo(() => {
    const today = startOfDay(new Date())
    const start = addDays(today, -29) // 30 días (incluye hoy)

    // buckets diarios con 0
    const buckets = []
    const map = new Map()

    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i)
      const key = toYYYYMMDD(d)
      const label = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}` // DD/MM
      const row = { dia: label, _key: key, creaciones: 0, actualizaciones: 0, eliminaciones: 0 }
      buckets.push(row)
      map.set(key, row)
    }

    for (const mov of movimientos) {
      if (!mov?.fecha_hora) continue
      const dt = new Date(mov.fecha_hora)
      if (Number.isNaN(dt.getTime())) continue
      const key = toYYYYMMDD(dt)
      const bucket = map.get(key)
      if (!bucket) continue

      const cat = getCategoriaMovimiento(mov.tipo_movimiento)
      if (cat === "CREACION") bucket.creaciones += 1
      else if (cat === "ACTUALIZACION") bucket.actualizaciones += 1
      else if (cat === "ELIMINACION") bucket.eliminaciones += 1
    }

    // quitamos _key antes de retornar
    return buckets.map(({ _key, ...rest }) => rest)
  }, [movimientos])

  // ✅ Últimos 5 movimientos (sin filtro de fecha, siempre los más recientes)
  const ultimos = useMemo(() => {
    const sorted = [...movimientos].sort((a, b) => {
      const da = new Date(a.fecha_hora || 0).getTime()
      const db = new Date(b.fecha_hora || 0).getTime()
      return db - da
    })
    return sorted.slice(0, 5)
  }, [movimientos])

  return (
    <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-accent flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Movimientos
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "Cargando..." : error ? error : "Últimos 30 días (por día)"}
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/movimientos")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs hover:bg-secondary"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="dia"
              stroke="#ccc"
              tick={{ fontSize: 11 }}
              interval={4} // muestra 1 etiqueta cada 5 aprox (para que no se amontone)
            />
            <YAxis stroke="#ccc" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="creaciones" name="Creaciones" fill="#22c55e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="actualizaciones" name="Actualizaciones" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            <Bar dataKey="eliminaciones" name="Eliminaciones" fill="#f97373" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando lista…</div>
        ) : ultimos.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin movimientos.</div>
        ) : (
          ultimos.map((mov) => {
            const etiqueta = getEtiquetaMovimiento(mov.tipo_movimiento)
            const categoria = getCategoriaMovimiento(mov.tipo_movimiento)

            const badge =
              categoria === "CREACION"
                ? "bg-green-500/20 text-green-400"
                : categoria === "ELIMINACION"
                ? "bg-red-500/20 text-red-400"
                : categoria === "ACTUALIZACION"
                ? "bg-sky-500/20 text-sky-400"
                : "bg-gray-500/20 text-gray-400"

            const barrilLabel =
              mov.barril_codigo_interno ||
              (mov.barril_id ? `Barril #${mov.barril_id}` : "Barril —")

            const usuarioLabel =
              mov.usuario_nombre ||
              (mov.usuario_id ? `Usuario #${mov.usuario_id}` : "Usuario —")

            return (
              <div
                key={mov.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{barrilLabel}</p>
                  <p className="text-xs text-muted-foreground truncate">{usuarioLabel}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${badge}`}>
                    {etiqueta}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatFecha(mov.fecha_hora)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
