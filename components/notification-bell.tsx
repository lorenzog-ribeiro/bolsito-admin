"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth"
import { createDashboardApi, Notification } from "@/lib/dashboard-api"

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

const BASE_POLL_MS = 60_000
const MAX_POLL_MS = 10 * 60_000 // 10 min max backoff

export function NotificationBell() {
  const { token } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const consecutiveErrors = useRef(0)

  const schedulePoll = useCallback((delayMs: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      if (!token) {
        schedulePoll(BASE_POLL_MS)
        return
      }
      try {
        const api = createDashboardApi(token)
        const res = await api.listNotifications("unread")
        setNotifications(res.data)
        setUnreadCount(res.unreadCount)
        consecutiveErrors.current = 0
        schedulePoll(BASE_POLL_MS)
      } catch {
        consecutiveErrors.current++
        const backoff = Math.min(
          BASE_POLL_MS * Math.pow(2, consecutiveErrors.current),
          MAX_POLL_MS,
        )
        schedulePoll(backoff)
      }
    }, delayMs)
  }, [token])

  useEffect(() => {
    // Initial fetch immediately
    if (token) {
      const api = createDashboardApi(token)
      api
        .listNotifications("unread")
        .then((res) => {
          setNotifications(res.data)
          setUnreadCount(res.unreadCount)
          consecutiveErrors.current = 0
        })
        .catch(() => {
          consecutiveErrors.current++
        })
    }
    schedulePoll(BASE_POLL_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [token, schedulePoll])

  const handleMarkRead = async (n: Notification) => {
    if (!token) return
    try {
      const api = createDashboardApi(token)
      await api.markNotificationRead(n.documentId)
      setNotifications((prev) => prev.filter((x) => x.documentId !== n.documentId))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}

    setOpen(false)
    router.push("/comentarios")
  }

  const handleMarkAllRead = async () => {
    if (!token) return
    try {
      const api = createDashboardApi(token)
      await api.markAllNotificationsRead()
      setNotifications([])
      setUnreadCount(0)
    } catch {}
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} notificações não lidas`
              : "Notificações"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação pendente
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.documentId}
                  onClick={() => handleMarkRead(n)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">
                        {n.payload?.commenterName || "Anônimo"}
                      </span>{" "}
                      comentou em{" "}
                      <span className="font-medium">
                        {n.payload?.contentTitle || "um conteúdo"}
                      </span>
                    </p>
                    {n.payload?.commentExcerpt && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        &ldquo;{n.payload.commentExcerpt}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
