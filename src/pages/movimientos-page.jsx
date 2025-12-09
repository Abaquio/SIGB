"use client"

import { useEffect, useState, useMemo } from "react"
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
import { TrendingUp, Filter } from "lucide-react"

// Datepicker
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { es } from "date-fns/locale"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

/**
 * Clasifica un tipo_movimiento a una categoría simple:
 *  - 'CREACION'       → CREAR_BARRIL, REACTIVAR_BARRIL, ALTA, CREAR
 *  - 'ELIMINACION'    → DESACTIVAR_BARRIL, BAJA, ELIMINAR
 *  - 'ACTUALIZACION'  → CAMBIO_UBICACION, CAMBIO_ESTADO, ACTUALIZAR
 *  - 'OTRO'           → cualquier otro
 */
function getCategoriaMovimiento(tipoRaw) {
  const t = (tipoRaw || "").toUpperCase()

  if (
    t.includes("CREAR_BARRIL") ||
    t.includes("REACTIVAR_BARRIL") ||
    t.includes("ALTA") ||
    t.includes("CREAR")
  ) {
    return "CREACION"
  }

  if (
    t.includes("DESACTIVAR_BARRIL") ||
    t.includes("BAJA") ||
    t.includes("ELIMINAR")
  ) {
    return "ELIMINACION"
  }

  if (
    t.includes("CAMBIO_UBICACION") ||
    t.includes("CAMBIO_ESTADO") ||
    t.includes("ACTUALIZAR")
  ) {
    return "ACTUALIZACION"
  }

  return "OTRO"
}

/**
 * Texto bonito para la etiqueta del chip
 */
function getEtiquetaMovimiento(tipoRaw) {
  const cat = getCategoriaMovimiento(tipoRaw)
  switch (cat) {
    case "CREACION":
      return "Creación"
    case "ELIMINACION":
      return "Eliminación"
    case "ACTUALIZACION":
      return "Actualización"
    default:
      return "Otro"
  }
}

/**
 * Construye los datos del gráfico:
 *  Creaciones / Actualizaciones / Eliminaciones por hora
 */
function buildChartData(movimientos) {
  if (!movimientos || movimientos.length === 0) return []

  const map = new Map()

  movimientos.forEach((mov) => {
    if (!mov.fecha_hora) return
    const fecha = new Date(mov.fecha_hora)
    if (Number.isNaN(fecha.getTime())) return

    const hour = fecha.getHours().toString().padStart(2, "0") + ":00"
    if (!map.has(hour)) {
      map.set(hour, {
        hora: hour,
        creaciones: 0,
        actualizaciones: 0,
        eliminaciones: 0,
      })
    }

    const bucket = map.get(hour)
    const cat = getCategoriaMovimiento(mov.tipo_movimiento)

    if (cat === "CREACION") bucket.creaciones += 1
    else if (cat === "ELIMINACION") bucket.eliminaciones += 1
    else if (cat === "ACTUALIZACION") bucket.actualizaciones += 1
  })

  return Array.from(map.values()).sort((a, b) => (a.hora > b.hora ? 1 : -1))
}

// Formateo de fecha
function formatFecha(fechaStr) {
  if (!fechaStr) return "Fecha desconocida"
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

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filtros
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [filterDateMode, setFilterDateMode] = useState("todos") // 'todos' | 'dia' | 'mes'
  const [filterDateValue, setFilterDateValue] = useState(null) // Date | null
  const [filterTipo, setFilterTipo] = useState("todos") // 'todos' | 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION'
  const [filterUsuario, setFilterUsuario] = useState("")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Cargar movimientos
  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE_URL}/api/movimientos`)
        if (!res.ok) {
          throw new Error("Error al obtener movimientos desde la API")
        }

        const data = await res.json()
        setMovimientos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("❌ Error cargando movimientos:", err)
        setError("No se pudieron cargar los movimientos")
      } finally {
        setLoading(false)
      }
    }

    fetchMovimientos()
  }, [])

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filterDateMode, filterDateValue, filterTipo, filterUsuario])

  // Aplicar filtros
  const filteredMovimientos = useMemo(() => {
    let result = [...movimientos]

    // Filtro por tipo (categoría)
    if (filterTipo !== "todos") {
      result = result.filter(
        (mov) => getCategoriaMovimiento(mov.tipo_movimiento) === filterTipo
      )
    }

    // Filtro por usuario
    if (filterUsuario.trim() !== "") {
      const q = filterUsuario.trim().toLowerCase()
      result = result.filter((mov) => {
        const nombre =
          mov.usuario_nombre ||
          mov.usuario ||
          (mov.usuario_id != null ? `usuario ${mov.usuario_id}` : "")
        return nombre.toLowerCase().includes(q)
      })
    }

    // Filtro por fecha
    if (filterDateMode !== "todos" && filterDateValue instanceof Date) {
      const filterYear = filterDateValue.getFullYear()
      const filterMonth = filterDateValue.getMonth() + 1 // 1-12
      const filterDay = filterDateValue.getDate()

      result = result.filter((mov) => {
        if (!mov.fecha_hora) return false
        const d = new Date(mov.fecha_hora)
        if (Number.isNaN(d.getTime())) return false

        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const day = d.getDate()

        if (filterDateMode === "dia") {
          return year === filterYear && month === filterMonth && day === filterDay
        }

        if (filterDateMode === "mes") {
          return year === filterYear && month === filterMonth
        }

        return true
      })
    }

    return result
  }, [movimientos, filterTipo, filterUsuario, filterDateMode, filterDateValue])

  // Datos gráfico basados en filtrados
  const chartData = useMemo(
    () => buildChartData(filteredMovimientos),
    [filteredMovimientos]
  )

  // Ordenar y paginar
  const sortedMovimientos = useMemo(() => {
    return [...filteredMovimientos].sort((a, b) => {
      const da = new Date(a.fecha_hora || 0).getTime()
      const db = new Date(b.fecha_hora || 0).getTime()
      return db - da
    })
  }, [filteredMovimientos])

  const totalPages = Math.max(
    1,
    Math.ceil(sortedMovimientos.length / itemsPerPage)
  )

  const paginatedMovimientos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedMovimientos.slice(start, end)
  }, [sortedMovimientos, currentPage])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          Movimientos de Inventario
        </h1>
        <button
          className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          <Filter className="w-5 h-5" />
          {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      {/* Filtros */}
      {filtersOpen && (
        <div className="bg-card border border-border rounded-lg p-6 text-sm text-foreground space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FECHA */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Fecha
              </label>

              <select
                value={filterDateMode}
                onChange={(e) => {
                  setFilterDateMode(e.target.value)
                  setFilterDateValue(null)
                }}
                className="px-3 py-2 rounded-lg bg-background border border-border text-foreground"
              >
                <option value="todos">Todos los registros</option>
                <option value="dia">Día específico</option>
                <option value="mes">Mes específico</option>
              </select>

              {filterDateMode === "dia" && (
                <DatePicker
                  selected={filterDateValue}
                  onChange={(date) => setFilterDateValue(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Seleccionar día"
                  className="px-3 py-2 rounded-lg bg-background border border-border text-foreground w-full"
                  locale={es}
                  calendarClassName="dark-datepicker"
                  todayButton="Hoy"
                />
              )}

              {filterDateMode === "mes" && (
                <DatePicker
                  selected={filterDateValue}
                  onChange={(date) => setFilterDateValue(date)}
                  dateFormat="yyyy-MM"
                  placeholderText="Seleccionar mes"
                  showMonthYearPicker
                  className="px-3 py-2 rounded-lg bg-background border border-border text-foreground w-full"
                  locale={es}
                  calendarClassName="dark-datepicker"
                />
              )}
            </div>

            {/* TIPO DE MOVIMIENTO */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Tipo de movimiento
              </label>

              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-3 py-2 rounded-lg bg-background border border-border text-foreground"
              >
                <option value="todos">Todos</option>
                <option value="CREACION">Creación</option>
                <option value="ACTUALIZACION">Actualización</option>
                <option value="ELIMINACION">Eliminación</option>
              </select>
            </div>

            {/* USUARIO */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Usuario
              </label>

              <input
                type="text"
                placeholder="Buscar por nombre o ID"
                value={filterUsuario}
                onChange={(e) => setFilterUsuario(e.target.value)}
                className="px-3 py-2 rounded-lg bg-background border border-border text-foreground"
              />

              <p className="text-[11px] text-muted-foreground">
                Preparado para el login (busca en usuario_nombre / usuario_id).
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setFilterDateMode("todos")
                setFilterDateValue(null)
                setFilterTipo("todos")
                setFilterUsuario("")
              }}
              className="px-4 py-2 text-xs rounded-lg border border-border hover:bg-secondary"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Movimientos por Hora (Creación, Actualización y Eliminación)
        </h2>

        {loading ? (
          <p className="text-sm text-foreground">Cargando movimientos...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-foreground">
            No hay movimientos que coincidan con los filtros actuales.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="hora" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #d4af37",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                dataKey="creaciones"
                name="Creaciones / Reactivaciones"
                fill="#22c55e"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="actualizaciones"
                name="Actualizaciones"
                fill="#38bdf8"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="eliminaciones"
                name="Eliminaciones / Inactivaciones"
                fill="#f97373"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Movimientos paginados */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Movimientos ({sortedMovimientos.length})
        </h2>

        {loading ? (
          <p className="text-sm text-foreground">Cargando movimientos...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : sortedMovimientos.length === 0 ? (
          <p className="text-sm text-foreground">
            No hay movimientos que coincidan con los filtros actuales.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedMovimientos.map((mov) => {
                const etiqueta = getEtiquetaMovimiento(mov.tipo_movimiento)
                const categoria = getCategoriaMovimiento(mov.tipo_movimiento)

                const barrilLabel =
                  mov.barril_codigo_interno ||
                  (mov.barril_id
                    ? `Barril #${mov.barril_id}`
                    : "Barril desconocido")

                const usuarioLabel =
                  mov.usuario_nombre ||
                  mov.usuario ||
                  (mov.usuario_id
                    ? `Usuario #${mov.usuario_id}`
                    : "Usuario desconocido")

                const badgeClasses =
                  categoria === "CREACION"
                    ? "bg-green-500/20 text-green-400"
                    : categoria === "ELIMINACION"
                    ? "bg-red-500/20 text-red-400"
                    : categoria === "ACTUALIZACION"
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-gray-500/20 text-gray-400"

                return (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {barrilLabel}
                      </p>
                      <p className="text-sm text-foreground">
                        {mov.tipo_movimiento || "Movimiento"}
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        {usuarioLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}
                      >
                        {etiqueta}
                      </span>
                      <p className="text-sm text-foreground mt-1">
                        {formatFecha(mov.fecha_hora)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  className="px-3 py-1 text-xs rounded-lg border border-border text-foreground disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-xs rounded-lg border ${
                        page === currentPage
                          ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                          : "border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="px-3 py-1 text-xs rounded-lg border border-border text-foreground disabled:opacity-40"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
