"use client"

import { AdminHeader } from "@/components/admin-header"
import {
  SIMULATOR_TYPES,
  SIMULATOR_LABELS,
} from "@/lib/dashboard-api"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Calculator } from "lucide-react"

export default function SimuladoresPage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Simuladores", href: "/simuladores" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Simuladores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de simuladores disponíveis. Clique em um para ver os parâmetros configurados.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {SIMULATOR_TYPES.map((type) => (
            <Link key={type} href={`/simuladores/${type}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calculator className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {SIMULATOR_LABELS[type] ?? type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {type}
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
