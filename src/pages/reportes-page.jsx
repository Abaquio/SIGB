"use client"

import { BarChart3, Download, Calendar, FileText } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const reporteData = [
  { mes: "Ene", produccion: 450, ventas: 420, stock: 230 },
  { mes: "Feb", produccion: 520, ventas: 490, stock: 260 },
  { mes: "Mar", produccion: 480, ventas: 450, stock: 290 },
  { mes: "Abr", produccion: 610, ventas: 580, stock: 320 },
  { mes: "May", produccion: 550, ventas: 520, stock: 350 },
  { mes: "Jun", produccion: 670, ventas: 640, stock: 380 },
]

const reportes = [
  { id: 1, titulo: "Reporte Mensual Junio", fecha: "2024-07-01", estado: "Completado" },
  { id: 2, titulo: "Análisis de Producción Q2", fecha: "2024-06-30", estado: "Completado" },
  { id: 3, titulo: "Reporte de Alertas Junio", fecha: "2024-06-30", estado: "Completado" },
  { id: 4, titulo: "Análisis de Calidad", fecha: "2024-06-25", estado: "Completado" },
]

export default function ReportesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          Reportes
        </h1>
        <button className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <FileText className="w-5 h-5" />
          Generar Reporte
        </button>
      </div>

      {/* Gráfico de tendencias */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Tendencias de Producción y Ventas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={reporteData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #d4af37" }} />
            <Legend />
            <Area type="monotone" dataKey="produccion" fill="#d4af37" stroke="#d4af37" fillOpacity={0.3} />
            <Area type="monotone" dataKey="ventas" fill="#66bb6a" stroke="#66bb6a" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Listado de reportes */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Reportes Generados
        </h2>
        <div className="space-y-3">
          {reportes.map((reporte) => (
            <div
              key={reporte.id}
              className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground">{reporte.titulo}</p>
                <p className="text-sm text-accent-foreground">{reporte.fecha}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  {reporte.estado}
                </span>
                <button className="p-2 hover:bg-secondary rounded transition-colors text-accent">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
