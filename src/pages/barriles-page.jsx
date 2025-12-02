"use client"

import { useEffect, useState } from "react"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { BadgeX as Barrel, Plus, Trash2, Edit } from "lucide-react"

// ⚠️ Por ahora el gráfico sigue siendo estático
const barrelsData = [
  { name: "Enero", cantidad: 45, capacidad: 100, porcentaje: 45 },
  { name: "Febrero", cantidad: 52, capacidad: 100, porcentaje: 52 },
  { name: "Marzo", cantidad: 48, capacidad: 100, porcentaje: 48 },
  { name: "Abril", cantidad: 61, capacidad: 100, porcentaje: 61 },
  { name: "Mayo", cantidad: 55, capacidad: 100, porcentaje: 55 },
  { name: "Junio", cantidad: 67, capacidad: 100, porcentaje: 67 },
]

// 👉 endpoint de tu backend
const API_BASE_URL = "http://localhost:4000"

export default function BarrelsPage() {
  const [barrels, setBarrels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBarrels = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE_URL}/api/barriles`)
        if (!res.ok) {
          throw new Error("No se pudieron obtener los barriles")
        }
        const data = await res.json()
        setBarrels(data || [])
      } catch (err) {
        console.error("Error al cargar barriles:", err)
        setError(err.message || "Error al cargar barriles")
      } finally {
        setLoading(false)
      }
    }

    fetchBarrels()
  }, [])

  // Para la barrita de "Capacidad" usamos la capacidad relativa al máximo
  const maxCapacidad =
    barrels.reduce((max, b) => {
      const cap = Number(b.capacidad_litros) || 0
      return cap > max ? cap : max
    }, 0) || 1

  const getCapacidadPercent = (capacidad_litros) => {
    const cap = Number(capacidad_litros) || 0
    return Math.round((cap / maxCapacidad) * 100)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <Barrel className="w-8 h-8" />
          Gestión de Barriles
        </h1>
        <button className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          Agregar Barril
        </button>
      </div>

      {/* Gráfico de capacidad (se deja estático por ahora) */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Evolución de Capacidad</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={barrelsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #d4af37" }} />
            <Legend />
            <Line type="monotone" dataKey="cantidad" stroke="#d4af37" strokeWidth={2} dot={{ fill: "#d4af37" }} />
            <Line type="monotone" dataKey="capacidad" stroke="#666" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estado de barriles - AHORA CONECTADO A SUPABASE */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Estado de Barriles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-accent font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Código</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Estado</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Ubicación</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Capacidad</th>
                <th className="px-4 py-3 text-left text-accent font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                    Cargando barriles...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && barrels.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                    No hay barriles registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                barrels.map((barrel) => {
                  const capacidadPercent = getCapacidadPercent(barrel.capacidad_litros)

                  return (
                    <tr key={barrel.id} className="border-b border-border hover:bg-secondary transition-colors">
                      <td className="px-4 py-3 text-foreground">#{barrel.id}</td>
                      <td className="px-4 py-3 text-foreground">
                        {barrel.codigo_interno || barrel.codigo_qr || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            barrel.estado_actual === "Activo" || barrel.estado_actual === "DISPONIBLE"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {barrel.estado_actual || "Sin estado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{barrel.tipo_cerveza || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{barrel.ubicacion_actual || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sidebar-primary to-accent"
                              style={{ width: `${capacidadPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {barrel.capacidad_litros ? `${barrel.capacidad_litros} L` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button className="p-2 hover:bg-secondary rounded transition-colors text-accent">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-secondary rounded transition-colors text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
