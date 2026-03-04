"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin-header"
import {
  createDashboardApi,
  SIMULATOR_LABELS,
  SIMULATOR_TYPES,
  type OptInSimulationExport,
} from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database, Download, Loader2 } from "lucide-react"

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsv(rows: OptInSimulationExport[]): string {
  const headers = ["ID", "Nome", "Email", "Simulador", "Data Simulação", "Data Opt-in"]
  const lines = [headers.map(escapeCsvField).join(",")]
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.nome,
        r.email,
        r.simulatorType,
        r.dataCriacao,
        r.emailOptInAt ? r.emailOptInAt.slice(0, 10) : "",
      ]
        .map(String)
        .map(escapeCsvField)
        .join(",")
    )
  }
  return lines.join("\n")
}

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now)
  start.setMonth(start.getMonth() - 1)
  return { start: start.toISOString().slice(0, 10), end }
}

export default function SimulacoesPage() {
  const { token } = useAuth()
  const [countByType, setCountByType] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const defaultRange = getDefaultDateRange()
  const [exportStart, setExportStart] = useState(defaultRange.start)
  const [exportEnd, setExportEnd] = useState(defaultRange.end)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const api = createDashboardApi(token)
    api
      .simulationsStats()
      .then((res) => {
        const map: Record<string, number> = {}
        for (const { simulatorType, count } of res.bySimulator) {
          map[simulatorType] = count
        }
        setCountByType(map)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleExport = async () => {
    if (!token) return
    setExportError(null)
    setExporting(true)
    try {
      const api = createDashboardApi(token)
      const data = await api.exportOptInSimulations({
        startDate: exportStart,
        endDate: exportEnd,
      })
      const csv = toCsv(data)
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `simulacoes-opt-in-${exportStart}-${exportEnd}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Erro ao exportar")
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Simulacoes", href: "/simulacoes" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Simulacoes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em um card para ver as simulações realizadas em cada simulador.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="size-4" />
              Exportar usuários (opt-in)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Exporte um CSV com as simulações do período em que os usuários aceitaram receber emails.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="export-start">Data inicial</Label>
                <Input
                  id="export-start"
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="export-end">Data final</Label>
                <Input
                  id="export-end"
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting || !exportStart || !exportEnd || exportStart > exportEnd}
                className="gap-2 w-fit"
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Download className="size-4" />
                    Exportar CSV
                  </>
                )}
              </Button>
            </div>
            {exportError && (
              <p className="text-sm text-destructive">{exportError}</p>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro: {error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {SIMULATOR_TYPES.map((simulatorType) => {
              const count = countByType[simulatorType] ?? 0
              return (
                <Link key={simulatorType} href={`/simulacoes/${simulatorType}`}>
                  <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Database className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {SIMULATOR_LABELS[simulatorType] ?? simulatorType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {count.toLocaleString("pt-BR")} simulações
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
