"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import {
  createDashboardApi,
  SIMULATOR_LABELS,
  type PlatformSimulation,
} from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Inbox } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 50

function SimulationRow({ sim }: { sim: PlatformSimulation }) {
  const [open, setOpen] = useState(false)
  const inputKeys = Object.keys(sim.inputData)
  const outputKeys = Object.keys(sim.outputData)
  const hasDetails = inputKeys.length > 0 || outputKeys.length > 0

  return (
    <>
      <TableRow>
        <TableCell>
          {hasDetails ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          ) : (
            <span className="inline-block w-6" />
          )}
        </TableCell>
        <TableCell className="font-mono text-xs">{sim.id}</TableCell>
        <TableCell>{sim.dataCriacao}</TableCell>
        <TableCell className="max-w-[200px] truncate">{sim.nome ?? "-"}</TableCell>
        <TableCell className="max-w-[200px] truncate">{sim.email ?? "-"}</TableCell>
        <TableCell>
          {inputKeys.length} campos
        </TableCell>
        <TableCell>
          {outputKeys.length} campos
        </TableCell>
      </TableRow>
      {hasDetails && open && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Inputs</p>
                <pre className="rounded-md bg-background p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(sim.inputData, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Outputs</p>
                <pre className="rounded-md bg-background p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(sim.outputData, null, 2)}
                </pre>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function SimulacoesPorTipoPage() {
  const params = useParams()
  const { token } = useAuth()
  const type = params.type as string
  const [simulations, setSimulations] = useState<PlatformSimulation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!token || !type) return
    setLoading(true)
    const api = createDashboardApi(token)
    api
      .listSimulations({
        simulatorType: type,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      .then((res) => {
        setSimulations(res.simulations)
        setTotal(res.total)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, type, page])

  const label = SIMULATOR_LABELS[type] ?? type
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Simulacoes", href: "/simulacoes" },
          { label },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/simulacoes" aria-label="Voltar">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString("pt-BR")} simulações
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro: {error}</p>
            </CardContent>
          </Card>
        ) : simulations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
              <Inbox className="size-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Nenhuma simulacao encontrada</p>
              <p className="text-sm text-muted-foreground">
                Ainda nao existem simulacoes deste tipo registradas.
              </p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/simulacoes">Voltar para simulacoes</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Inputs</TableHead>
                      <TableHead>Outputs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulations.map((sim) => (
                      <SimulationRow key={sim.id} sim={sim} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Pagina {page + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Proxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
