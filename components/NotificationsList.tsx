"use client"

import { useState, useEffect } from "react"
import type { NotificationWithSender } from "@/lib/types"          // targetId / targetType вече са в интерфейса
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Heart,
  MessageCircle,
  UserPlus,
  Check,
  UserCheck,
  Bell,
  Trash2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()

  /* -------------------------------------------------------------------------- */
  /* fetch                                                                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/notifications")
      const data = await res.json()

      if (data.success) setNotifications(data.data)
      else setError(data.error || "Неуспешно зареждане на известия")
    } catch {
      setError("Възникна грешка при зареждане на известията")
    } finally {
      setLoading(false)
    }
  }

  /* -------------------------------------------------------------------------- */
  /* helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" })
      const data = await res.json()
      if (data.success)
        setNotifications(n => n.map(x => (x.id === id ? { ...x, read: true } : x)))
      else
        toast({ title: "Грешка", description: data.error || "Неуспешно", variant: "destructive" })
    } catch {
      toast({ title: "Грешка", description: "Грешка при маркиране", variant: "destructive" })
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setNotifications(n => n.filter(x => x.id !== id))
        toast({ title: "Успешно", description: "Известието е изтрито" })
      } else {
        toast({ title: "Грешка", description: data.error || "Неуспешно", variant: "destructive" })
      }
    } catch {
      toast({ title: "Грешка", description: "Грешка при изтриване", variant: "destructive" })
    }
  }

  /* friend-request actions */
  const acceptRequest = async (notifId: string, requestId: string) => {
    if (!requestId) return
    setProcessingRequests(p => ({ ...p, [notifId]: true }))

    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    })
    const data = await res.json()

    if (data.success) {
      setNotifications(n => n.map(x => (x.id === notifId ? { ...x, read: true } : x)))
      toast({ title: "Успешно", description: "Поканата е приета" })
    } else {
      toast({ title: "Грешка", description: data.error ?? "Неуспешно", variant: "destructive" })
    }

    setProcessingRequests(p => ({ ...p, [notifId]: false }))
  }

  const rejectRequest = async (notifId: string, requestId: string) => {
    if (!requestId) return

    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    })
    const data = await res.json()

    if (data.success) {
      setNotifications(n => n.map(x => (x.id === notifId ? { ...x, read: true } : x)))
      toast({ title: "Успешно", description: "Поканата е отхвърлена" })
    } else {
      toast({ title: "Грешка", description: data.error ?? "Неуспешно", variant: "destructive" })
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" })
      const data = await res.json()

      if (data.success) {
        setNotifications(n => n.map(x => ({ ...x, read: true })))
        toast({ title: "Успешно", description: "Всички известия са маркирани като прочетени" })
      } else {
        toast({ title: "Грешка", description: data.error || "Неуспешно", variant: "destructive" })
      }
    } catch {
      toast({ title: "Грешка", description: "Грешка при операцията", variant: "destructive" })
    }
  }

  const goToProfile = (id?: string) => id && router.push(`/profile/${id}`)

  const iconFor = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-5 w-5 text-red-500" />
      case "COMMENT":
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case "FRIEND_REQUEST":
        return <UserPlus className="h-5 w-5 text-green-500" />
      case "FRIEND_ACCEPT":
        return <UserCheck className="h-5 w-5 text-green-500" />
      case "NEW_MESSAGE":
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const openMessage = (n: NotificationWithSender) => {
    if (n.type === "NEW_MESSAGE" && n.targetId) router.push(`/messages?id=${n.targetId}`)
  }

  /* -------------------------------------------------------------------------- */
  /* render                                                                     */
  /* -------------------------------------------------------------------------- */
  if (loading) return <div className="text-center py-8">Зареждане на известия...</div>
  if (error) return <div className="text-center py-8 text-red-500">Грешка: {error}</div>

  const unread = notifications.filter(n => !n.read).length

  return (
    <Card className="flex-1">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Известия</CardTitle>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Маркирай всички като прочетени
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="py-8 text-center">Все още нямате известия.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-center space-x-4 rounded-lg p-3 ${
                  n.read ? "bg-white" : "bg-blue-50"
                } ${n.type === "NEW_MESSAGE" ? "cursor-pointer" : ""}`}
                onClick={() => (n.type === "NEW_MESSAGE" ? openMessage(n) : null)}
              >
                {/* avatar */}
                <Avatar
                  className="cursor-pointer transition-all hover:ring-2 hover:ring-primary"
                  onClick={e => {
                    e.stopPropagation()
                    goToProfile(n.sender?.id)
                  }}
                >
                  <AvatarImage src={n.sender?.image || undefined} alt={n.sender?.name || ""} />
                  <AvatarFallback>{n.sender?.name?.[0]}</AvatarFallback>
                </Avatar>

                {/* text */}
                <div className="flex-1">
                  <p>
                    <span
                      className="cursor-pointer font-semibold hover:underline"
                      onClick={e => {
                        e.stopPropagation()
                        goToProfile(n.sender?.id)
                      }}
                    >
                      {n.sender?.name}
                    </span>{" "}
                    {n.content}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(n.createdAt)}</p>
                </div>

                {/* actions */}
                <div className="flex items-center space-x-2">
                  {iconFor(n.type)}

                  {n.type === "FRIEND_REQUEST" && !n.read && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        disabled={processingRequests[n.id]}
                        onClick={e => {
                          e.stopPropagation()
                          if (n.targetId) acceptRequest(n.id, n.targetId)
                        }}
                      >
                        {processingRequests[n.id] ? "Обработва се..." : "Приеми"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation()
                          if (n.targetId) rejectRequest(n.id, n.targetId)
                        }}
                      >
                        Откажи
                      </Button>
                    </div>
                  )}

                  {n.type !== "FRIEND_REQUEST" && !n.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        markAsRead(n.id)
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={e => {
                      e.stopPropagation()
                      deleteNotification(n.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
