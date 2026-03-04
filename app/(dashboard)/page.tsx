import { Activity, FileBarChart2 } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { MetricCard } from "@/components/metric-card"
import { OverviewChart } from "@/components/overview-chart"
import { SimulationTypeBreakdown } from "@/components/simulation-type-breakdown"
import { getOverviewStats } from "@/lib/mock-data"

export default function DashboardPage() {
  const stats = getOverviewStats()

  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Visao Geral" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Visao Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumo da atividade da plataforma
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-2">
          <MetricCard
            title="Simulacoes Totais"
            value={stats.totalSimulations}
            icon={FileBarChart2}
          />
          <MetricCard
            title="Ultimos 30 Dias"
            value={stats.last30Days}
            description="novas simulacoes"
            icon={Activity}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <OverviewChart />
          <SimulationTypeBreakdown />
        </div>
      </div>
    </>
  )
}
