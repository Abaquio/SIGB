"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, Filter } from "lucide-react"

const movimientosData = [
  { hora: "08:00", entrada: 12, salida: 5 },
  { hora: "10:00", entrada: 19, salida: 8 },
  { hora: "12:00", entrada: 25, salida: 12 },
  { hora: "14:00", entrada: 18, salida: 15 },
  { hora: "16:00", entrada: 22, salida: 10 },
  { hora: "18:00", entrada: 28, salida: 18 },
  { hora: "20:00", entrada: 35, salida: 25 },
]

const movimientosRecientes = [
  { id: 1, tipo: "Entrada", barril: "#1", cantidad: "50L", fecha: "Hoy 14:30", usuario: "Juan García" },
  { id: 2, tipo: "Salida", barril: "#2", cantidad: "30L", fecha: "Hoy 13:15", usuario: "María López" },
  { id: 3, tipo: "Entrada", barril: "#3", cantidad: "50L", fecha: "Hoy 11:45", usuario: "Juan García" },
  { id: 4, tipo: "Salida", barril: "#4", cantidad: "25L", fecha: "Hoy 10:20", usuario: "Carlos Ruiz" },
  { id: 5, tipo: "Entrada", barril: "#5", cantidad: "50L", fecha: "Hoy 09:00", usuario: "María López" },
]

export default function MovimientosPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <TrendingUp className="w-8 h-8" />
          Movimientos de Inventario
        </h1>
        <button className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Filter className="w-5 h-5" />
          Filtrar
        </button>
      </div>

      {/* Gráfico de movimientos */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Movimientos por Hora</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={movimientosData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #d4af37" }} />
            <Legend />
            <Bar dataKey="entrada" fill="#d4af37" radius={[8, 8, 0, 0]} />
            <Bar dataKey="salida" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Historial reciente */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Movimientos Recientes</h2>
        <div className="space-y-3">
          {movimientosRecientes.map((mov) => (
            <div
              key={mov.id}
              className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {mov.barril} - {mov.cantidad}
                </p>
                <p className="text-sm text-accent-foreground">{mov.usuario}</p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    mov.tipo === "Entrada" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {mov.tipo}
                </span>
                <p className="text-sm text-accent-foreground mt-1">{mov.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
