"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import {
  createDashboardApi,
  SIMULATOR_LABELS,
} from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

type ParamValue = string | number | boolean | null | ParamRecord[] | ParamRecord
interface ParamRecord {
  id?: number
  [key: string]: ParamValue | undefined
}

function isParamRecord(x: ParamValue): x is ParamRecord {
  return x !== null && typeof x === "object" && !Array.isArray(x)
}

function isParamRecordArray(x: ParamValue): x is ParamRecord[] {
  return Array.isArray(x) && x.every((i) => isParamRecord(i))
}

function ParamRecordEditor({
  record,
  simulatorType,
  onSave,
  canEdit,
}: {
  record: ParamRecord
  simulatorType: string
  onSave: (id: string, body: Record<string, unknown>) => Promise<void>
  canEdit: boolean
}) {
  const [local, setLocal] = useState<ParamRecord>(() => ({ ...record }))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocal({ ...record })
  }, [record])

  const handleSave = useCallback(async () => {
    const id = record.id
    if (id == null || !canEdit) return
    const body: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(local)) {
      if (k === "id" || k === "taxas") continue
      if (v !== (record as Record<string, unknown>)[k]) {
        body[k] = v
      }
    }
    if (Object.keys(body).length === 0) return
    setSaving(true)
    try {
      await onSave(String(id), body)
    } finally {
      setSaving(false)
    }
  }, [local, record, canEdit, onSave])

  const recordId = record.id
  const taxas = record.taxas

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(local).map(([key, value]) => {
          if (key === "id" || key === "taxas") return null
          const isBool = typeof value === "boolean"
          const isNum = typeof value === "number"
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
          return (
            <div key={key} className="flex flex-col gap-2">
              <Label className="text-muted-foreground">{label}</Label>
              {isBool ? (
                canEdit ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!local[key]}
                      onCheckedChange={(v) =>
                        setLocal((p) => ({ ...p, [key]: v }))
                      }
                    />
                    <span className="text-sm">{local[key] ? "Sim" : "Não"}</span>
                  </div>
                ) : (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm">
                    {value ? "Sim" : "Não"}
                  </p>
                )
              ) : canEdit ? (
                <Input
                  type={isNum ? "number" : "text"}
                  step={isNum ? "any" : undefined}
                  value={value ?? ""}
                  onChange={(e) =>
                    setLocal((p) => ({
                      ...p,
                      [key]: isNum
                        ? (e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value))
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
      {canEdit && recordId != null && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </Button>
      )}
      {isParamRecordArray(taxas) && taxas.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground">Taxas</p>
          {taxas.map((t) => (
            <TaxaEditor
              key={t.id}
              taxa={t}
              simulatorType={simulatorType}
              onSave={onSave}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaxaEditor({
  taxa,
  simulatorType,
  onSave,
  canEdit,
}: {
  taxa: ParamRecord
  simulatorType: string
  onSave: (id: string, body: Record<string, unknown>) => Promise<void>
  canEdit: boolean
}) {
  const [parcela, setParcela] = useState(taxa.parcela ?? "")
  const [taxaVal, setTaxaVal] = useState(taxa.taxa ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    const id = taxa.id
    if (id == null || !canEdit) return
    setSaving(true)
    try {
      await onSave(String(id), {
        parcela: parcela === "" ? undefined : Number(parcela),
        taxa: taxaVal === "" ? undefined : Number(taxaVal),
      })
    } finally {
      setSaving(false)
    }
  }, [taxa.id, parcela, taxaVal, canEdit, onSave])

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Parcela</Label>
        <Input
          type="number"
          value={parcela}
          onChange={(e) => setParcela(e.target.value)}
          disabled={!canEdit}
          className="w-20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Taxa</Label>
        <Input
          type="number"
          step="any"
          value={taxaVal}
          onChange={(e) => setTaxaVal(e.target.value)}
          disabled={!canEdit}
          className="w-24"
        />
      </div>
      {canEdit && (
        <Button size="sm" onClick={handleSave} disabled={saving} className="mt-4 gap-1">
          {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
          Salvar
        </Button>
      )}
    </div>
  )
}

export default function SimuladorParamsPage() {
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
    const res = await api.simulatorParams(type)
    setData(res)
  }, [token, type])

  useEffect(() => {
    if (!token || !type) return
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, type, refresh])

  const handleSave = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      if (!token) return
      const api = createDashboardApi(token)
      await api.updateSimulatorParam(type, id, body)
      await refresh()
    },
    [token, type, refresh]
  )

  const label = SIMULATOR_LABELS[type] ?? type

  if (data !== null && typeof data === "object" && "message" in data) {
    return (
      <>
        <AdminHeader breadcrumbs={[{ label: "Simuladores", href: "/simuladores" }, { label }]} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/simuladores" aria-label="Voltar">
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

  const records = Array.isArray(data) ? data : data && typeof data === "object" ? [data] : []

  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Simuladores", href: "/simuladores" }, { label }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/simuladores" aria-label="Voltar">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
            <p className="text-sm text-muted-foreground">
              {type}
              {canEdit && (
                <span className="ml-2 text-primary">(edição permitida)</span>
              )}
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
        ) : (
          <div className="space-y-6">
            {records.map((r, idx) => {
              const rec = r as ParamRecord
              if (rec.id == null && !("message" in rec)) return null
              const title =
                "instituicao" in rec
                  ? String(rec.instituicao ?? rec.nome ?? `Registro ${idx + 1}`)
                  : "nome" in rec
                    ? String(rec.nome)
                    : `Registro #${rec.id ?? idx + 1}`
              return (
                <Card key={rec.id ?? idx}>
                  <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ParamRecordEditor
                      record={rec}
                      simulatorType={type}
                      onSave={handleSave}
                      canEdit={canEdit}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
