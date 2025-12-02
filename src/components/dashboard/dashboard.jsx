"use client"

import DashboardCards from "./dashboard-cards"
import BarrelsChart from "./barrels-chart"
import MovementsChart from "./movements-chart"
import StatsGrid from "./stats-grid"

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cards de estadísticas principales */}
      <DashboardCards />

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarrelsChart />
        <MovementsChart />
      </div>

      {/* Estadísticas adicionales */}
      <StatsGrid />
    </div>
  )
}
