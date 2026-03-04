"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getOverviewStats, simulationTypeLabels, type SimulationType } from "@/lib/mock-data"

const COLORS = [
  "oklch(0.60 0.15 170)",
  "oklch(0.55 0.15 250)",
  "oklch(0.70 0.18 45)",
  "oklch(0.60 0.12 290)",
  "oklch(0.65 0.14 140)",
]

export function SimulationTypeBreakdown() {
  const stats = getOverviewStats()

  const data = (Object.entries(stats.byType) as [SimulationType, number][]).map(
    ([key, value]) => ({
      tipo: simulationTypeLabels[key],
      total: value,
    })
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulacoes por Tipo</CardTitle>
        <CardDescription>Distribuicao entre os tipos de simulacao</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="tipo"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0.015 230)",
                  border: "1px solid oklch(0.24 0.02 230)",
                  borderRadius: "8px",
                  color: "oklch(0.92 0.01 210)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
