"use client"

import { BadgePlus as Barrels, TrendingUp, AlertCircle, BarChart3 } from "lucide-react"

const cards = [
  {
    title: "Barriles Activos",
    value: "24",
    icon: Barrels,
    color: "from-blue-600 to-blue-400",
    subtext: "+2 esta semana",
  },
  {
    title: "Movimientos",
    value: "156",
    icon: TrendingUp,
    color: "from-purple-600 to-purple-400",
    subtext: "+12% desde ayer",
  },
  {
    title: "Alertas Activas",
    value: "3",
    icon: AlertCircle,
    color: "from-orange-600 to-orange-400",
    subtext: "2 críticas",
  },
  {
    title: "Producción Hoy",
    value: "450L",
    icon: BarChart3,
    color: "from-green-600 to-green-400",
    subtext: "Meta: 500L",
  },
]

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-gradient-to-br from-card to-secondary p-6 rounded-xl border border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold text-accent mt-2">{card.value}</h3>
              </div>
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${card.color} text-white group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{card.subtext}</p>
          </div>
        )
      })}
    </div>
  )
}
