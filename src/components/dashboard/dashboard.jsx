"use client"

import DashboardCards from "./dashboard-cards"

// ✅ mismos folder -> "./"
import BarrilesWidget from "./BarrilesWidget"
import MovimientosWidget from "./MovimientosWidget"
import ReportesWidget from "./ReportesWidget"

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarrilesWidget />
        <MovimientosWidget />
      </div>

      <ReportesWidget />
    </div>
  )
}
