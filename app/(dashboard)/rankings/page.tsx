"use client"

import { AdminHeader } from "@/components/admin-header"
import { RANKING_TYPES } from "@/lib/dashboard-api"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy } from "lucide-react"

export default function RankingsPage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Rankings", href: "/rankings" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Rankings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de rankings disponíveis. Clique em um para ver os parâmetros e informações.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {RANKING_TYPES.map((r) => (
            <Link key={r.id} href={`/rankings/${r.id}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Trophy className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{r.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
