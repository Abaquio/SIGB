"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

const qualityData = [
  { name: "Excelente", value: 65, color: "#d4af37" },
  { name: "Bueno", value: 25, color: "#f59e0b" },
  { name: "Regular", value: 8, color: "#ef4444" },
  { name: "Deficiente", value: 2, color: "#7c2d12" },
]

const efficiencyData = [
  { day: "Lun", efficiency: 92 },
  { day: "Mar", efficiency: 88 },
  { day: "Mié", efficiency: 95 },
  { day: "Jue", efficiency: 91 },
  { day: "Vie", efficiency: 96 },
  { day: "Sáb", efficiency: 89 },
]

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Control de Calidad */}
      <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
        <h3 className="text-xl font-bold text-accent mb-4">Control de Calidad</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={qualityData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {qualityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#d4af37" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2 text-sm">
          {qualityData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">
                {item.name}: {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Eficiencia Semanal */}
      <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
        <h3 className="text-xl font-bold text-accent mb-4">Eficiencia Semanal</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="day" stroke="#a0a0a0" />
            <YAxis stroke="#a0a0a0" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #d4af37",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#d4af37" }}
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#d4af37"
              strokeWidth={3}
              dot={{ fill: "#d4af37", r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
