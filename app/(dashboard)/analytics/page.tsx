"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Activity,
  FileBarChart2,
  TrendingUp,
  MousePointerClick,
  Eye,
  Filter,
  Users,
  Timer,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { toast } from "sonner"
import { AdminHeader } from "@/components/admin-header"
import { MetricCard } from "@/components/metric-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createDashboardApi, SIMULATOR_LABELS, type BlogTrackingStats } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import { formatDuration } from "@/lib/tracking"

interface DashboardStats {
  bySimulator: { simulatorType: string; count: number }[]
  byDay: { date: string; count: number }[]
  byWeek: { weekStart: string; count: number }[]
  byMonth: { month: string; count: number }[]
  total: number
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6",
  "#eab308", "#a855f7", "#ef4444",
]

type DateRange = "7d" | "30d" | "90d" | "12m" | "all"

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 500,
  padding: "8px 12px",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.3)",
}

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [blogStats, setBlogStats] = useState<BlogTrackingStats | null>(null)
  const [blogStatsLoading, setBlogStatsLoading] = useState(true)

  const handleDateRangeChange = useCallback((value: DateRange) => {
    setDateRange(value)
  }, [])

  useEffect(() => {
    if (!token) return

    setIsLoading(true)
    const api = createDashboardApi(token)

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
      case "12m":
        startDate.setMonth(startDate.getMonth() - 12)
        break
      case "all":
        startDate = new Date("2020-01-01")
        break
    }

    api.simulationsStats({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
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

    // Also fetch blog tracking stats
    setBlogStatsLoading(true)
    api.blogTrackingStats({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
      .then((data) => {
        setBlogStats(data)
      })
      .catch((err) => {
        console.error("Failed to load blog tracking stats:", err)
        // Don't show error for tracking stats - it's optional
      })
      .finally(() => {
        setBlogStatsLoading(false)
      })
  }, [token, dateRange])

  // Processed data
  const processedData = useMemo(() => {
    if (!stats) return null

    // Daily trend
    const dailyTrend = stats.byDay
      .slice(-30)
      .map((item) => ({
        date: formatDate(item.date),
        value: item.count,
      }))

    // Weekly trend
    const weeklyTrend = stats.byWeek
      .slice(-12)
      .map((item) => ({
        week: formatWeek(item.weekStart),
        value: item.count,
      }))

    // Monthly trend
    const monthlyTrend = stats.byMonth
      .slice(-12)
      .map((item) => ({
        month: formatMonth(item.month),
        value: item.count,
      }))

    // Top simulators
    const topSimulators = [...stats.bySimulator]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        name: SIMULATOR_LABELS[item.simulatorType] || item.simulatorType,
        type: item.simulatorType,
        count: item.count,
        percentage: Math.round((item.count / stats.total) * 100),
      }))

    // Pie chart data
    const pieData = stats.bySimulator.map((item) => ({
      name: SIMULATOR_LABELS[item.simulatorType] || item.simulatorType,
      value: item.count,
    }))

    // Calculate growth
    const last7Days = stats.byDay
      .filter((item) => {
        const date = new Date(item.date)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        return diff <= 7
      })
      .reduce((sum, item) => sum + item.count, 0)

    const previous7Days = stats.byDay
      .filter((item) => {
        const date = new Date(item.date)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        return diff > 7 && diff <= 14
      })
      .reduce((sum, item) => sum + item.count, 0)

    const weeklyGrowth = previous7Days > 0
      ? Math.round(((last7Days - previous7Days) / previous7Days) * 100)
      : 0

    // Average per day
    const avgPerDay = stats.byDay.length > 0
      ? Math.round(stats.total / stats.byDay.length)
      : 0

    return {
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      topSimulators,
      pieData,
      last7Days,
      weeklyGrowth,
      avgPerDay,
    }
  }, [stats])

  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Analytics" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Metricas detalhadas e insights da plataforma
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={(v) => handleDateRangeChange(v as DateRange)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                <SelectItem value="12m">Ultimos 12 meses</SelectItem>
                <SelectItem value="all">Todo periodo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total de Simulacoes"
            value={stats?.total?.toLocaleString("pt-BR")}
            icon={FileBarChart2}
            isLoading={isLoading}
          />
          <MetricCard
            title="Ultimos 7 Dias"
            value={processedData?.last7Days?.toLocaleString("pt-BR")}
            icon={Activity}
            isLoading={isLoading}
            trend={processedData?.weeklyGrowth !== undefined ? {
              value: Math.abs(processedData.weeklyGrowth),
              isPositive: processedData.weeklyGrowth >= 0,
            } : undefined}
          />
          <MetricCard
            title="Media Diaria"
            value={processedData?.avgPerDay?.toLocaleString("pt-BR")}
            description="simulacoes por dia"
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <MetricCard
            title="Tipos Ativos"
            value={stats?.bySimulator?.length}
            description="simuladores utilizados"
            icon={Eye}
            isLoading={isLoading}
          />
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trend">Tendencia</TabsTrigger>
            <TabsTrigger value="distribution">Distribuicao</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Daily Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia Diaria</CardTitle>
                  <CardDescription>Simulacoes por dia nos ultimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processedData?.dailyTrend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                          />
                          <Area type="monotone" dataKey="value" name="Simulacoes" stroke="#10b981" fill="url(#trendGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia Semanal</CardTitle>
                  <CardDescription>Simulacoes por semana</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData?.weeklyTrend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                          />
                          <Bar dataKey="value" name="Simulacoes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Evolucao Mensal</CardTitle>
                <CardDescription>Total de simulacoes por mes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData?.monthlyTrend ?? []} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend />
                        <Line type="monotone" dataKey="value" name="Simulacoes" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuicao por Tipo</CardTitle>
                  <CardDescription>Porcentagem de cada simulador</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={processedData?.pieData ?? []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                          >
                            {(processedData?.pieData ?? []).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Simulators Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Simuladores</CardTitle>
                  <CardDescription>Simuladores mais utilizados</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Simulador</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData?.topSimulators?.map((item, index) => (
                          <TableRow key={item.type}>
                            <TableCell className="font-medium">
                              {index === 0 ? (
                                <Badge variant="default" className="bg-yellow-500">1</Badge>
                              ) : index === 1 ? (
                                <Badge variant="default" className="bg-gray-400">2</Badge>
                              ) : index === 2 ? (
                                <Badge variant="default" className="bg-amber-600">3</Badge>
                              ) : (
                                <span className="text-muted-foreground">{index + 1}</span>
                              )}
                            </TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right font-medium">
                              {item.count.toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {item.percentage}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {/* Comparison Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Simuladores</CardTitle>
                <CardDescription>Volume de utilizacao por tipo de simulador</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedData?.topSimulators ?? []}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="count" name="Simulacoes" radius={[0, 4, 4, 0]}>
                          {(processedData?.topSimulators ?? []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Blog Tracking Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MousePointerClick className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Tracking do Blog</h2>
            <span className="text-xs text-muted-foreground">(educandoseubolso.com.br)</span>
          </div>

          {/* Blog Tracking KPIs */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Page Views"
              value={blogStats?.totalPageViews?.toLocaleString("pt-BR") ?? "0"}
              icon={Eye}
              isLoading={blogStatsLoading}
            />
            <MetricCard
              title="Sessoes"
              value={blogStats?.totalSessions?.toLocaleString("pt-BR") ?? "0"}
              icon={Users}
              isLoading={blogStatsLoading}
            />
            <MetricCard
              title="Duracao Media"
              value={blogStats?.avgSessionDuration ? formatDuration(blogStats.avgSessionDuration) : "0s"}
              description="por sessao"
              icon={Timer}
              isLoading={blogStatsLoading}
            />
            <MetricCard
              title="Artigos Lidos"
              value={blogStats?.eventsByType?.article_view?.toLocaleString("pt-BR") ?? "0"}
              icon={FileBarChart2}
              isLoading={blogStatsLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paginas Mais Visitadas</CardTitle>
                <CardDescription>Tempo medio por pagina</CardDescription>
              </CardHeader>
              <CardContent>
                {blogStatsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : blogStats?.topPages && blogStats.topPages.length > 0 ? (
                  <div className="space-y-3">
                    {blogStats.topPages.slice(0, 8).map((page, i) => (
                      <div key={page.path} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                          <span className="text-sm truncate" title={page.path}>
                            {page.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="secondary">{page.views}x</Badge>
                          <span className="text-muted-foreground w-16 text-right">
                            {formatDuration(page.avgTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="mx-auto size-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado de pagina ainda</p>
                    <p className="text-xs mt-1">Visite o blog para gerar eventos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Artigos Mais Lidos</CardTitle>
                <CardDescription>Conteudo mais popular</CardDescription>
              </CardHeader>
              <CardContent>
                {blogStatsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : blogStats?.topArticles && blogStats.topArticles.length > 0 ? (
                  <div className="space-y-3">
                    {blogStats.topArticles.slice(0, 8).map((article, i) => (
                      <div key={article.slug} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                          <span className="text-sm truncate" title={article.title}>
                            {article.title}
                          </span>
                        </div>
                        <Badge variant="outline">{article.views} views</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileBarChart2 className="mx-auto size-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum artigo lido ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Page Views by Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Views por Dia</CardTitle>
              <CardDescription>Trafego do blog nos ultimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {blogStatsLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : blogStats?.pageViewsByDay && blogStats.pageViewsByDay.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={blogStats.pageViewsByDay} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="blogViewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                          const d = new Date(v)
                          return `${d.getDate()}/${d.getMonth() + 1}`
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="count" name="Page Views" stroke="#8b5cf6" fill="url(#blogViewsGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">Nenhum dado disponivel</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Simulator Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uso de Simuladores</CardTitle>
                <CardDescription>Inicios e conclusoes</CardDescription>
              </CardHeader>
              <CardContent>
                {blogStatsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : blogStats?.simulatorUsage && blogStats.simulatorUsage.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Simulador</TableHead>
                        <TableHead className="text-right">Inicios</TableHead>
                        <TableHead className="text-right">Conclusoes</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogStats.simulatorUsage.slice(0, 8).map((sim) => (
                        <TableRow key={sim.type}>
                          <TableCell className="font-medium">
                            {SIMULATOR_LABELS[sim.type] || sim.type}
                          </TableCell>
                          <TableCell className="text-right">{sim.starts}</TableCell>
                          <TableCell className="text-right">{sim.completions}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {sim.starts > 0 ? Math.round((sim.completions / sim.starts) * 100) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="mx-auto size-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum uso de simulador registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buscas Populares</CardTitle>
                <CardDescription>Termos mais pesquisados</CardDescription>
              </CardHeader>
              <CardContent>
                {blogStatsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : blogStats?.searchQueries && blogStats.searchQueries.length > 0 ? (
                  <div className="space-y-3">
                    {blogStats.searchQueries.slice(0, 10).map((query, i) => (
                      <div key={query.query} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                          <span className="text-sm truncate">"{query.query}"</span>
                        </div>
                        <Badge variant="outline">{query.count}x</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="mx-auto size-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma busca registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eventos Recentes do Blog</CardTitle>
              <CardDescription>Ultimas interacoes no site</CardDescription>
            </CardHeader>
            <CardContent>
              {blogStatsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : blogStats?.recentEvents && blogStats.recentEvents.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pagina</TableHead>
                        <TableHead>Titulo</TableHead>
                        <TableHead className="text-right">Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogStats.recentEvents.slice(0, 20).map((event, idx) => (
                        <TableRow key={`${event.timestamp}-${idx}`}>
                          <TableCell>
                            <Badge
                              variant={
                                event.type === "page_view" ? "default" :
                                event.type === "article_view" ? "secondary" :
                                event.type === "simulator_complete" ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {(event.type ?? "unknown").replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate" title={event.path ?? ""}>
                            {event.path ?? "-"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate" title={event.title ?? ""}>
                            {event.title || "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto size-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum evento registrado ainda</p>
                  <p className="text-xs mt-1">Visite o blog para gerar eventos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function formatWeek(weekStart: string): string {
  const date = new Date(weekStart)
  return `Sem ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-")
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const monthIndex = parseInt(month, 10) - 1
  const shortYear = year.slice(-2)
  return `${monthNames[monthIndex] || month} ${shortYear}`
}
