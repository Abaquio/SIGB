"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { name: "Lunes", llenado: 85, vaciado: 30, producción: 450 },
  { name: "Martes", llenado: 92, vaciado: 28, producción: 480 },
  { name: "Miércoles", llenado: 78, vaciado: 35, producción: 420 },
  { name: "Jueves", llenado: 88, vaciado: 32, producción: 460 },
  { name: "Viernes", llenado: 95, vaciado: 25, producción: 500 },
  { name: "Sábado", llenado: 102, vaciado: 40, producción: 540 },
  { name: "Domingo", llenado: 68, vaciado: 45, producción: 380 },
]

export default function BarrelsChart() {
  return (
    <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
      <h3 className="text-xl font-bold text-accent mb-4">Actividad de Barriles</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="name" stroke="#a0a0a0" />
          <YAxis stroke="#a0a0a0" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #d4af37",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#d4af37" }}
          />
          <Legend />
          <Bar dataKey="llenado" fill="#d4af37" radius={[8, 8, 0, 0]} />
          <Bar dataKey="vaciado" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
