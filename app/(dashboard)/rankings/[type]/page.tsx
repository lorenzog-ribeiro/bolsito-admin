"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { createDashboardApi, RANKING_TYPES } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Loader2, Save, Inbox } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
interface RankingItem {
  id: number
  nome?: string
  empresa?: string
  nota?: number
  nota_conta?: number
  desconto?: string
  imagem?: string
  ativo?: boolean
  [key: string]: unknown
}

// Campos que nao devem ser editaveis
const READ_ONLY_FIELDS = ["id", "empresa", "planos"]

// Campos que devem ser renderizados como switch
const BOOLEAN_FIELDS = ["ativo"]

// Campos que devem ser renderizados como number
const NUMBER_FIELDS = ["nota", "nota_conta"]

function RankingItemEditor({
  item,
  rankingType,
  onSave,
  canEdit,
}: {
  item: RankingItem
  rankingType: string
  onSave: (id: number, body: Record<string, unknown>) => Promise<void>
  canEdit: boolean
}) {
  const [local, setLocal] = useState<RankingItem>(() => ({ ...item }))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocal({ ...item })
  }, [item])

  const handleSave = useCallback(async () => {
    if (!canEdit || item.id == null) return

    const changes: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(local)) {
      if (READ_ONLY_FIELDS.includes(key)) continue
      if (value !== item[key]) {
        changes[key] = value
      }
    }

    if (Object.keys(changes).length === 0) {
      toast.info("Nenhuma alteracao para salvar")
      return
    }

    setSaving(true)
    try {
      await onSave(item.id, changes)
    } finally {
      setSaving(false)
    }
  }, [local, item, canEdit, onSave])

  const editableFields = Object.entries(local).filter(
    ([key]) => !READ_ONLY_FIELDS.includes(key) && key !== "id"
  )

  const readOnlyFields = Object.entries(local).filter(
    ([key]) => READ_ONLY_FIELDS.includes(key) || key === "id"
  )

  return (
    <div className="space-y-4">
      {/* Read-only fields */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {readOnlyFields.map(([key, value]) => {
          if (key === "planos" || typeof value === "object") return null
          const label = formatLabel(key)
          return (
            <div key={key} className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">{label}</Label>
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                {value != null ? String(value) : "-"}
              </p>
            </div>
          )
        })}
      </div>

      {/* Editable fields */}
      {editableFields.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Campos editaveis
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editableFields.map(([key, value]) => {
              if (typeof value === "object" && value !== null) return null

              const label = formatLabel(key)
              const isBool = BOOLEAN_FIELDS.includes(key) || typeof value === "boolean"
              const isNum = NUMBER_FIELDS.includes(key) || typeof value === "number"

              if (isBool) {
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <Label className="text-muted-foreground text-xs">{label}</Label>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!local[key]}
                          onCheckedChange={(v) =>
                            setLocal((prev) => ({ ...prev, [key]: v }))
                          }
                        />
                        <span className="text-sm">{local[key] ? "Sim" : "Nao"}</span>
                      </div>
                    ) : (
                      <p className="rounded-md bg-muted px-3 py-2 text-sm">
                        {value ? "Sim" : "Nao"}
                      </p>
                    )}
                  </div>
                )
              }

              const inputValue = local[key] as string | number | undefined
              return (
                <div key={key} className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-xs">{label}</Label>
                  {canEdit ? (
                    <Input
                      type={isNum ? "number" : "text"}
                      step={isNum ? "any" : undefined}
                      value={inputValue ?? ""}
                      onChange={(e) =>
                        setLocal((prev) => ({
                          ...prev,
                          [key]: isNum
                            ? e.target.value === ""
                              ? null
                              : parseFloat(e.target.value)
                            : e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="rounded-md bg-muted px-3 py-2 text-sm">
                      {value != null ? String(value) : "-"}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {canEdit && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-2 mt-2"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </Button>
      )}
    </div>
  )
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

export default function RankingParamsPage() {
  const params = useParams()
  const { token, user } = useAuth()
  const type = params.type as string
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canEdit = user?.isSuperuser === true

  const refresh = useCallback(async () => {
    if (!token || !type) return
    const api = createDashboardApi(token)
    const res = await api.rankingParams(type)
    setData(res)
  }, [token, type])

  useEffect(() => {
    if (!token || !type) return
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, type, refresh])

  const handleSave = useCallback(
    async (id: number, body: Record<string, unknown>) => {
      if (!token) return
      try {
        const api = createDashboardApi(token)
        await api.updateRankingParam(type, String(id), body)
        await refresh()
        toast.success("Parametro atualizado com sucesso")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar")
        throw e
      }
    },
    [token, type, refresh]
  )

  const ranking = RANKING_TYPES.find((r) => r.id === type)
  const label = ranking?.label ?? type

  // Check if data is a message response
  if (data !== null && typeof data === "object" && "message" in data) {
    return (
      <>
        <AdminHeader breadcrumbs={[{ label: "Rankings", href: "/rankings" }, { label }]} />
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
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {(data as { message: string }).message}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const items: RankingItem[] = Array.isArray(data) ? data : []

  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Rankings", href: "/rankings" }, { label }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/rankings" aria-label="Voltar">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
            <p className="text-sm text-muted-foreground">
              {type}
              {canEdit && (
                <span className="ml-2 text-primary">(edicao permitida)</span>
              )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro: {error}</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
              <Inbox className="size-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Nenhum item encontrado</p>
              <p className="text-sm text-muted-foreground">
                Este ranking nao possui itens configurados.
              </p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/rankings">Voltar para rankings</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <Card key={item.id ?? idx}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {item.nome ?? item.empresa ?? `Item #${item.id ?? idx + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RankingItemEditor
                    item={item}
                    rankingType={type}
                    onSave={handleSave}
                    canEdit={canEdit}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
