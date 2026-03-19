"use client"

import { useEffect, useState } from "react"
import { Activity, FileBarChart2, TrendingUp, Users } from "lucide-react"
import { toast } from "sonner"
import { AdminHeader } from "@/components/admin-header"
import { MetricCard } from "@/components/metric-card"
import { OverviewChart } from "@/components/overview-chart"
import { SimulationTypeBreakdown } from "@/components/simulation-type-breakdown"
import { createDashboardApi, SIMULATOR_LABELS } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"

interface DashboardStats {
  bySimulator: { simulatorType: string; count: number }[]
  byDay: { date: string; count: number }[]
  byWeek: { weekStart: string; count: number }[]
  byMonth: { month: string; count: number }[]
  total: number
}

export default function DashboardPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const api = createDashboardApi(token)

    api.simulationsStats()
      .then((data) => {
        setStats(data)
        setError(null)
      })
      .catch((err) => {
        console.error("Failed to load stats:", err)
        setError(err.message || "Erro ao carregar estatisticas")
        toast.error("Erro ao carregar estatisticas")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  // Transform data for charts
  const monthlyData = stats?.byMonth?.map((item) => ({
    label: formatMonth(item.month),
    value: item.count,
  })) ?? []

  const breakdownData = stats?.bySimulator?.map((item) => ({
    tipo: SIMULATOR_LABELS[item.simulatorType] || item.simulatorType,
    total: item.count,
  })) ?? []

  // Calculate last 30 days
  const last30Days = stats?.byDay?.reduce((sum, item) => {
    const date = new Date(item.date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 ? sum + item.count : sum
  }, 0) ?? 0

  // Calculate last 7 days
  const last7Days = stats?.byDay?.reduce((sum, item) => {
    const date = new Date(item.date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 ? sum + item.count : sum
  }, 0) ?? 0

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

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Simulacoes Totais"
            value={stats?.total?.toLocaleString("pt-BR")}
            icon={FileBarChart2}
            isLoading={isLoading}
          />
          <MetricCard
            title="Ultimos 30 Dias"
            value={last30Days.toLocaleString("pt-BR")}
            description="novas simulacoes"
            icon={Activity}
            isLoading={isLoading}
          />
          <MetricCard
            title="Ultimos 7 Dias"
            value={last7Days.toLocaleString("pt-BR")}
            description="novas simulacoes"
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <MetricCard
            title="Tipos Ativos"
            value={stats?.bySimulator?.length}
            description="simuladores em uso"
            icon={Users}
            isLoading={isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <OverviewChart
            data={monthlyData}
            isLoading={isLoading}
          />
          <SimulationTypeBreakdown
            data={breakdownData}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  )
}

function formatMonth(monthStr: string): string {
  // monthStr format: "2026-03" or similar
  const [year, month] = monthStr.split("-")
  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ]
  const monthIndex = parseInt(month, 10) - 1
  const shortYear = year.slice(-2)
  return `${monthNames[monthIndex] || month} ${shortYear}`
}
