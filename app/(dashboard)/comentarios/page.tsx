"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  Check,
  X,
  Clock,
  Trash2,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createDashboardApi, Comment } from "@/lib/dashboard-api"
import { useAuth } from "@/lib/auth"

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprovado",
  hold: "Pendente",
  spam: "Spam",
  trash: "Lixeira",
}

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-500/10 text-green-700 border-green-500/20",
  hold: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  spam: "bg-red-500/10 text-red-700 border-red-500/20",
  trash: "bg-gray-500/10 text-gray-700 border-gray-500/20",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

function CommentSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ComentariosPage() {
  const { token } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  const fetchComments = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const api = createDashboardApi(token)
      const response = await api.listComments({
        page,
        perPage,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      setComments(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (err) {
      console.error("Failed to load comments:", err)
      toast.error("Erro ao carregar comentarios")
    } finally {
      setLoading(false)
    }
  }, [token, page, perPage, statusFilter])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleStatusChange = async (commentId: number, newStatus: string) => {
    if (!token) return

    try {
      const api = createDashboardApi(token)
      await api.updateCommentStatus(commentId, newStatus)
      toast.success(`Comentario ${STATUS_LABELS[newStatus].toLowerCase()}`)
      fetchComments()
    } catch (err) {
      console.error("Failed to update comment:", err)
      toast.error("Erro ao atualizar comentario")
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!token) return

    try {
      const api = createDashboardApi(token)
      await api.deleteComment(commentId)
      toast.success("Comentario excluido")
      fetchComments()
    } catch (err) {
      console.error("Failed to delete comment:", err)
      toast.error("Erro ao excluir comentario")
    }
  }

  return (
    <>
      <AdminHeader breadcrumbs={[{ label: "Comentarios" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Moderacao de Comentarios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} comentarios no total
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="hold">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="trash">Lixeira</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : comments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum comentario encontrado</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {comment.authorAvatarUrl && (
                        <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <Badge variant="outline" className={STATUS_COLORS[comment.status]}>
                          {STATUS_LABELS[comment.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.date)}
                        </span>
                      </div>

                      {comment.postTitle && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <span>em</span>
                          <a
                            href={`https://educandoseubolso.com.br/blog/${comment.postSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {comment.postTitle}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      <div
                        className="text-sm text-foreground/90 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />

                      {comment.parentId > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Resposta a outro comentario
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {comment.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-700 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => handleStatusChange(comment.id, "approved")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Aprovar
                          </Button>
                        )}

                        {comment.status !== "hold" && comment.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/10"
                            onClick={() => handleStatusChange(comment.id, "hold")}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Pendente
                          </Button>
                        )}

                        {comment.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/10"
                            onClick={() => handleStatusChange(comment.id, "hold")}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Suspender
                          </Button>
                        )}

                        {comment.status !== "spam" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-700 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleStatusChange(comment.id, "spam")}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Spam
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir comentario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acao nao pode ser desfeita. O comentario de {comment.authorName} sera permanentemente excluido.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(comment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Proxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
