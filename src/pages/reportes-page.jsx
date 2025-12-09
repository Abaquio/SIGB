"use client"

import { useState, useMemo, useEffect } from "react"
import { BarChart3, Download, Calendar, FileText } from "lucide-react"
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
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

// Helpers -----------------------
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

  if (t.includes("CREAR") || t.includes("ALTA") || t.includes("REACTIVAR"))
    return "CREACION"

  if (t.includes("ELIMINAR") || t.includes("DESACTIVAR") || t.includes("BAJA"))
    return "ELIMINACION"

  if (
    t.includes("ACTUALIZAR") ||
    t.includes("CAMBIO_UBICACION") ||
    t.includes("CAMBIO_ESTADO")
  )
    return "ACTUALIZACION"

  return "OTRO"
}

// ------------------------------------------

export default function ReportesPage() {
  const [modo, setModo] = useState("diario")
  const [fecha, setFecha] = useState("")
  const [mes, setMes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reporte, setReporte] = useState(null)

  // paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // 👉 Cargar reporte diario automáticamente al abrir la página
  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    setFecha(hoy)
    generarReporte("diario", hoy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // función principal para generar reportes -----------------------
  const generarReporte = async (modoForzado, value) => {
    try {
      setLoading(true)
      setError(null)

      const m = modoForzado || modo
      const val = value || (m === "diario" ? fecha : mes)

      if (!val) return

      const url =
        m === "diario"
          ? `${API_BASE_URL}/api/reportes/diario?fecha=${val}`
          : `${API_BASE_URL}/api/reportes/mensual?mes=${val}`

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Error generando reporte")

      setReporte(data)
      setCurrentPage(1)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // movimientos con seguridad
  const movimientos = reporte?.movimientos || []

  const totalPages = Math.max(1, Math.ceil(movimientos.length / itemsPerPage))

  const paginatedMovimientos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return movimientos.slice(start, start + itemsPerPage)
  }, [movimientos, currentPage])

  // -------------------------------
  // GRÁFICO: datos según reporte
  // -------------------------------
  const chartData = useMemo(() => {
    if (!movimientos.length) return []

    const map = new Map()

    movimientos.forEach((mov) => {
      if (!mov.fecha_hora) return
      const fecha = mov.fecha_hora.slice(0, 10) // YYYY-MM-DD
      if (!map.has(fecha)) {
        map.set(fecha, {
          fecha,
          creacion: 0,
          actualizacion: 0,
          eliminacion: 0,
        })
      }
      const cat = getCategoriaMovimiento(mov.tipo_movimiento)
      if (cat === "CREACION") map.get(fecha).creacion++
      if (cat === "ACTUALIZACION") map.get(fecha).actualizacion++
      if (cat === "ELIMINACION") map.get(fecha).eliminacion++
    })

    return Array.from(map.values()).sort((a, b) =>
      a.fecha > b.fecha ? 1 : -1
    )
  }, [movimientos])

  // -------------------------------
  // Exportación a PDF
  // -------------------------------
  const exportPdf = () => {
    if (!reporte) return

    const doc = new jsPDF()
    const titulo =
      modo === "diario"
        ? `Reporte Diario (${reporte.fecha || fecha})`
        : `Reporte Mensual (${reporte.mes || mes})`

    doc.setFontSize(16)
    doc.text("SIGB - Reporte de Movimientos", 14, 18)

    doc.setFontSize(12)
    doc.text(titulo, 14, 28)

    // Resumen
    const resumenStart = 36
    doc.text(
      `Total movimientos: ${
        reporte.total_movimientos ?? movimientos.length
      }`,
      14,
      resumenStart
    )
    doc.text(
      `Total alertas: ${reporte.total_alertas ?? (reporte.alertas?.length || 0)}`,
      14,
      resumenStart + 6
    )

    // TABLA
    const body = movimientos.map((mov) => [
      formatFecha(mov.fecha_hora),
      mov.tipo_movimiento || "—",
      mov.barril_id ? `#${mov.barril_id}` : "—",
      mov.usuario_id ? `#${mov.usuario_id}` : "—",
    ])

    autoTable(doc, {
      startY: resumenStart + 14,
      head: [["Fecha", "Tipo", "Barril", "Usuario"]],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [212, 175, 55] },
    })

    const fileName =
      modo === "diario"
        ? `reporte-diario-${reporte.fecha || fecha}.pdf`
        : `reporte-mensual-${reporte.mes || mes}.pdf`

    doc.save(fileName)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          Reportes
        </h1>

        {/* CONTROLES */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select
            value={modo}
            onChange={(e) => {
              setModo(e.target.value)
              setError(null)
            }}
            className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm"
          >
            <option value="diario">Reporte diario</option>
            <option value="mensual">Reporte mensual</option>
          </select>

          {modo === "diario" ? (
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm"
            />
          ) : (
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm"
            />
          )}

          <button
            onClick={() => generarReporte()}
            disabled={loading}
            className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 text-sm disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            {loading ? "Generando..." : "Generar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-700 text-red-400 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* GRAFICO */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {modo === "diario"
            ? "Movimientos del día"
            : "Tendencias del mes (Creación, Actualización, Eliminación)"}
        </h2>

        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay datos para mostrar.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="fecha" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #d4af37",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="creacion" name="Creación" fill="#22c55e" />
              <Bar dataKey="actualizacion" name="Actualización" fill="#38bdf8" />
              <Bar dataKey="eliminacion" name="Eliminación" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* LISTA + PAGINACION + EXPORT */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resultados del reporte
          </h2>

        <button
          onClick={exportPdf}
          disabled={!reporte || movimientos.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
        </div>

        {!reporte ? (
          <p className="text-muted-foreground">Genera un reporte.</p>
        ) : movimientos.length === 0 ? (
          <p className="text-muted-foreground">Sin movimientos para este período.</p>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedMovimientos.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {mov.tipo_movimiento || "Movimiento"}
                    </p>
                    {/* aquí cambiamos a texto CLARO */}
                    <p className="text-sm text-foreground">
                      {formatFecha(mov.fecha_hora)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                      Barril #{mov.barril_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINACION */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded border text-sm ${
                        page === currentPage
                          ? "bg-sidebar-primary text-black border-sidebar-primary"
                          : "border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
