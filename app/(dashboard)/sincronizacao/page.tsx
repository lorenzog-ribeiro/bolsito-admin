"use client"

import { useEffect, useState } from "react"
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { createDashboardApi, type SyncLog } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"

function StatusBadge({ status }: { status: SyncLog["status"] }) {
  if (status === "success") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Sucesso
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Falhou
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      Rodando
    </Badge>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—"
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function SincronizacaoPage() {
  const { token } = useAuth()
  const [history, setHistory] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  async function loadHistory() {
    if (!token) return
    try {
      const api = createDashboardApi(token)
      const data = await api.syncHistory()
      setHistory(data)
    } catch {
      toast.error("Erro ao carregar histórico de sincronização")
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    if (!token || syncing) return
    setSyncing(true)
    try {
      const api = createDashboardApi(token)
      const result = await api.triggerPostSync()
      toast.success(
        `${result.postsUpserted} posts sincronizados em ${(result.durationMs / 1000).toFixed(1)}s`
      )
      await loadHistory()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error(`Sincronização falhou: ${msg}`)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const latest = history[0] ?? null

  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Sincronização de Posts" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sincronização de Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sincronize os posts do WordPress com o banco de dados local
          </p>
        </div>

        {/* Status card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Última sincronização</CardTitle>
            <CardDescription>
              O banco é atualizado automaticamente todos os dias às 04:00
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : latest ? (
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={latest.status} />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(latest.startedAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {latest.postsUpserted} posts atualizados · {latest.postsSoftDeleted} desativados · {formatDuration(latest.startedAt, latest.finishedAt)}
                </p>
                {latest.error && (
                  <p className="text-xs text-destructive font-mono mt-1">{latest.error}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground flex-1">
                Nenhuma sincronização realizada ainda. Execute a sincronização manual abaixo.
              </p>
            )}

            <Button
              onClick={handleSync}
              disabled={syncing}
              className="shrink-0"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum registro encontrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Início</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Atualizados</TableHead>
                    <TableHead className="text-right">Desativados</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{formatDate(log.startedAt)}</TableCell>
                      <TableCell><StatusBadge status={log.status} /></TableCell>
                      <TableCell className="text-right text-sm">{log.postsUpserted}</TableCell>
                      <TableCell className="text-right text-sm">{log.postsSoftDeleted}</TableCell>
                      <TableCell className="text-right text-sm">{formatDuration(log.startedAt, log.finishedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
