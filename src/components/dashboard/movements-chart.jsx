"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { time: "00:00", entrada: 12, salida: 8, transferencia: 2 },
  { time: "04:00", entrada: 18, salida: 10, transferencia: 3 },
  { time: "08:00", entrada: 45, salida: 22, transferencia: 8 },
  { time: "12:00", entrada: 68, salida: 35, transferencia: 12 },
  { time: "16:00", entrada: 92, salida: 48, transferencia: 15 },
  { time: "20:00", entrada: 78, salida: 52, transferencia: 10 },
  { time: "23:59", entrada: 45, salida: 30, transferencia: 5 },
]

export default function MovementsChart() {
  return (
    <div className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300">
      <h3 className="text-xl font-bold text-accent mb-4">Movimientos del Día</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="time" stroke="#a0a0a0" />
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
          <Line type="monotone" dataKey="entrada" stroke="#d4af37" strokeWidth={3} dot={{ fill: "#d4af37", r: 4 }} />
          <Line type="monotone" dataKey="salida" stroke="#ec4899" strokeWidth={3} dot={{ fill: "#ec4899", r: 4 }} />
          <Line
            type="monotone"
            dataKey="transferencia"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{ fill: "#06b6d4", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
