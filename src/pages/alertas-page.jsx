"use client"

const alertas = [
  {
    id: 1,
    tipo: "Crítica",
    titulo: "Temperatura fuera de rango",
    barril: "Barril #3",
    detalles: "Temperatura 8.5°C - máximo 5°C",
    hora: "Hace 5 minutos",
  },
  {
    id: 2,
    tipo: "Advertencia",
    titulo: "Barril con bajo stock",
    barril: "Barril #1",
    detalles: "Llenado al 15% - considera reabastecimiento",
    hora: "Hace 30 minutos",
  },
  {
    id: 3,
    tipo: "Crítica",
    titulo: "Fallo en sensor",
    barril: "Barril #7",
    detalles: "Sensor de temperatura no responde",
    hora: "Hace 1 hora",
  },
  {
    id: 4,
    tipo: "Advertencia",
    titulo: "Mantenimiento vencido",
    barril: "Barril #2",
    detalles: "Últimas 2 semanas sin mantenimiento",
    hora: "Hace 2 horas",
  },
  {
    id: 5,
    tipo: "Información",
    titulo: "Inventario actualizado",
    barril: "Sistema",
    detalles: "Sincronización completada con éxito",
    hora: "Hace 3 horas",
  },
]

export default function AlertasPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
        <span className="text-4xl">⚠️</span>
        Alertas del Sistema
      </h1>

      {/* Resumen de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">Críticas</p>
          <p className="text-3xl font-bold text-red-500">2</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm font-medium">Advertencias</p>
          <p className="text-3xl font-bold text-yellow-500">2</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-medium">Información</p>
          <p className="text-3xl font-bold text-blue-500">1</p>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {alertas.map((alerta) => {
          const colorMap = {
            Crítica: "border-l-red-500 bg-red-500/5",
            Advertencia: "border-l-yellow-500 bg-yellow-500/5",
            Información: "border-l-blue-500 bg-blue-500/5",
          }
          const textColorMap = {
            Crítica: "text-red-400",
            Advertencia: "text-yellow-400",
            Información: "text-blue-400",
          }
          const borderColor = colorMap[alerta.tipo] || colorMap.Información
          const textColor = textColorMap[alerta.tipo] || textColorMap.Información

          return (
            <div key={alerta.id} className={`bg-card border-l-4 rounded-lg p-4 transition-all ${borderColor}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${textColor}`}>{alerta.tipo}</span>
                    <h3 className="font-semibold text-foreground">{alerta.titulo}</h3>
                  </div>
                  <p className="text-sm text-accent-foreground mb-2">{alerta.detalles}</p>
                  <div className="flex items-center gap-4 text-xs text-accent-foreground">
                    <span>{alerta.barril}</span>
                    <span>{alerta.hora}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary rounded transition-colors text-green-400">
                    <span className="text-lg">✓</span>
                  </button>
                  <button className="p-2 hover:bg-secondary rounded transition-colors text-destructive">
                    <span className="text-lg">🗑️</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
