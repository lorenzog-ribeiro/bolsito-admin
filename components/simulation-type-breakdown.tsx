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
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = [
  "oklch(0.60 0.15 170)",
  "oklch(0.55 0.15 250)",
  "oklch(0.70 0.18 45)",
  "oklch(0.60 0.12 290)",
  "oklch(0.65 0.14 140)",
  "oklch(0.58 0.16 200)",
  "oklch(0.62 0.14 320)",
  "oklch(0.68 0.12 80)",
  "oklch(0.56 0.18 260)",
  "oklch(0.64 0.15 100)",
  "oklch(0.52 0.14 180)",
  "oklch(0.72 0.10 30)",
  "oklch(0.60 0.16 220)",
]

interface BreakdownDataPoint {
  tipo: string
  total: number
}

interface SimulationTypeBreakdownProps {
  data?: BreakdownDataPoint[]
  isLoading?: boolean
  title?: string
  description?: string
}

export function SimulationTypeBreakdown({
  data,
  isLoading = false,
  title = "Simulacoes por Tipo",
  description = "Distribuicao entre os tipos de simulacao"
}: SimulationTypeBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponivel
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.3)",
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
