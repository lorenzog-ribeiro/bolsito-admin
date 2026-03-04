"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { createDashboardApi, RANKING_TYPES } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

function ParamsDisplay({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null
  if (typeof data === "object" && "message" in data) {
    return (
      <p className="text-sm text-muted-foreground">
        {(data as { message: string }).message}
      </p>
    )
  }
  const obj = data as Record<string, unknown>
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum parâmetro configurado.</p>
  }
  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{key}</span>
          <pre className="rounded-md bg-muted p-3 text-sm overflow-x-auto">
            {Array.isArray(value)
              ? JSON.stringify(value, null, 2)
              : typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
          </pre>
        </div>
      ))}
    </div>
  )
}

export default function RankingParamsPage() {
  const params = useParams()
  const { token } = useAuth()
  const type = params.type as string
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !type) return
    const api = createDashboardApi(token)
    api
      .rankingParams(type)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, type])

  const ranking = RANKING_TYPES.find((r) => r.id === type)
  const label = ranking?.label ?? type

  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Rankings", href: "/rankings" },
          { label },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/rankings" aria-label="Voltar">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
            <p className="text-sm text-muted-foreground">{type}</p>
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros do ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <ParamsDisplay data={data} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
