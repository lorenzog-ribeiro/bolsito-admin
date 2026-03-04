"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin-header"
import { createDashboardApi, type ImageItem } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderOpen, ArrowLeft, ImageIcon } from "lucide-react"

function groupByFolder(images: ImageItem[]): Map<string, ImageItem[]> {
  const map = new Map<string, ImageItem[]>()
  for (const img of images) {
    let folder: string
    if (img.file_path.startsWith("relatorio/")) {
      folder = "relatorio"
    } else if (img.file_path.startsWith("amortizacao/")) {
      folder = "amortizacao"
    } else {
      const lastSlash = img.file_path.lastIndexOf("/")
      folder = lastSlash >= 0 ? img.file_path.slice(0, lastSlash) : ""
    }
    const list = map.get(folder) ?? []
    list.push(img)
    map.set(folder, list)
  }
  const sorted = new Map<string, ImageItem[]>()
  for (const [path] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    sorted.set(path, map.get(path)!)
  }
  return sorted
}

export default function AssetsPage() {
  const { token } = useAuth()
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const api = createDashboardApi(token)
    api
      .images()
      .then(setImages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = images.filter((img) => {
    const fileName = img.file_path.split("/").pop() ?? ""
    if (fileName === ".DS_Store") return false
    return !filter || img.file_path.toLowerCase().includes(filter.toLowerCase())
  })
  const byFolder = groupByFolder(filtered)
  const folderImages =
    selectedFolder !== null ? byFolder.get(selectedFolder) ?? [] : []

  if (loading) {
    return (
      <>
        <AdminHeader breadcrumbs={[{ label: "Assets", href: "/assets" }]} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="space-y-10">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <AdminHeader breadcrumbs={[{ label: "Assets", href: "/assets" }]} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro: {error}</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // Página inicial: lista de pastas
  if (selectedFolder === null) {
    const folders = Array.from(byFolder.entries()).filter(([path]) => path !== "")
    return (
      <>
        <AdminHeader breadcrumbs={[{ label: "Assets", href: "/assets" }]} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="space-y-10">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Imagens na AWS
              </h1>
              <p className="text-muted-foreground">
                Selecione uma pasta para ver as imagens.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Input
                type="text"
                placeholder="Filtrar por caminho..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                {folders.length} {folders.length === 1 ? "pasta" : "pastas"} ·{" "}
                {filtered.length} imagens
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {folders.map(([folderPath, imgs]) => {
                const firstImage = imgs.find((f) => f.full_url)
                const displayName = folderPath || "/"
                return (
                  <button
                    key={folderPath || "(raiz)"}
                    type="button"
                    onClick={() => setSelectedFolder(folderPath)}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted/50">
                      {firstImage?.full_url ? (
                        <img
                          src={firstImage.full_url}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <FolderOpen className="size-16 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {imgs.length}{" "}
                          {imgs.length === 1 ? "imagem" : "imagens"}
                        </p>
                      </div>
                      <FolderOpen className="size-5 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                )
              })}
            </div>

            {folders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma pasta encontrada.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </>
    )
  }

  // Página da pasta: galeria de imagens
  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Assets", href: "/assets" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFolder(null)}
                aria-label="Voltar para pastas"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedFolder || "/"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {folderImages.length}{" "}
                  {folderImages.length === 1 ? "imagem" : "imagens"}
                </p>
              </div>
            </div>
          </div>

          {folderImages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-1 py-16">
                <ImageIcon className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhuma imagem nesta pasta.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedFolder(null)}
                  className="mt-4"
                >
                  Voltar para pastas
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {folderImages.map((img) => {
                const fileName = img.file_path.includes("/")
                  ? img.file_path.split("/").pop() ?? img.file_path
                  : img.file_path
                return (
                  <a
                    key={img.file_path}
                    href={img.full_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-border bg-muted/30 transition-all hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      {img.full_url ? (
                        <img
                          src={img.full_url}
                          alt={fileName}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display =
                              "none"
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Sem URL
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-xs text-white">{fileName}</p>
                    </div>
                    <div className="absolute right-2 top-2">
                      <Badge
                        variant={img.source === "db" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {img.source}
                      </Badge>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
