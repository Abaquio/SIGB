"use client"

import { History, Download, Filter } from "lucide-react"

const historialData = [
  {
    id: 1,
    evento: "Barril #1 actualizado",
    detalles: "Temperatura: 4.5°C",
    fecha: "2024-01-15 14:30",
    usuario: "Juan García",
  },
  {
    id: 2,
    evento: "Movimiento registrado",
    detalles: "Salida: 30L desde Barril #2",
    fecha: "2024-01-15 13:15",
    usuario: "María López",
  },
  {
    id: 3,
    evento: "Alerta de temperatura",
    detalles: "Barril #3 fuera de rango",
    fecha: "2024-01-15 11:45",
    usuario: "Sistema",
  },
  {
    id: 4,
    evento: "Mantenimiento completado",
    detalles: "Barril #4 limpieza general",
    fecha: "2024-01-15 10:20",
    usuario: "Carlos Ruiz",
  },
  {
    id: 5,
    evento: "Inventario sincronizado",
    detalles: "5 barriles verificados",
    fecha: "2024-01-15 09:00",
    usuario: "Sistema",
  },
  {
    id: 6,
    evento: "Reporte generado",
    detalles: "Reporte semanal completo",
    fecha: "2024-01-14 18:00",
    usuario: "Admin",
  },
]

export default function HistorialPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          <History className="w-8 h-8" />
          Historial de Eventos
        </h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">
            <Filter className="w-5 h-5" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            <Download className="w-5 h-5" />
            Descargar
          </button>
        </div>
      </div>

      {/* Timeline de eventos */}
      <div className="space-y-4">
        {historialData.map((item, index) => (
          <div key={item.id} className="relative flex gap-4">
            {/* Línea conectora */}
            {index < historialData.length - 1 && (
              <div className="absolute left-4 top-12 w-1 h-12 bg-gradient-to-b from-sidebar-primary to-transparent" />
            )}

            {/* Punto en la línea */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center border-4 border-background relative z-10">
              <div className="w-2 h-2 bg-background rounded-full" />
            </div>

            {/* Contenido */}
            <div className="flex-1 bg-card rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{item.evento}</h3>
                  <p className="text-sm text-accent-foreground mt-1">{item.detalles}</p>
                </div>
                <span className="text-xs text-accent-foreground bg-secondary px-3 py-1 rounded-full">
                  {item.usuario}
                </span>
              </div>
              <p className="text-xs text-accent-foreground mt-3">{item.fecha}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
