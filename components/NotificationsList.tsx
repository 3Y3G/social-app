"use client"

import { useState, useEffect } from "react"
import type { NotificationWithSender } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, UserPlus, Check, UserCheck, Bell, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data)
      } else {
        setError(data.error || "Неуспешно зареждане на известия")
      }
    } catch (error) {
      setError("Възникна грешка при зареждане на известията")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      })
      const data = await response.json()

      if (data.success) {
        setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно маркиране като прочетено",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при маркиране на известието",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        toast({
          title: "Успешно",
          description: "Известието е изтрито",
        })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно изтриване",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при изтриване на известие",
        variant: "destructive",
      })
    }
  }

  const handleAcceptFriendRequest = async (notificationId: string, friendRequestId: string) => {
    try {
      const acceptResponse = await fetch(`/api/friends/requests/${friendRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })
      const acceptData = await acceptResponse.json()

      if (acceptData.success) {
        await fetch(`/api/notifications/${notificationId}`, { method: "PATCH" })
        setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        toast({ title: "Успешно", description: "Поканата е приета" })
        router.refresh()
      } else {
        toast({
          title: "Грешка",
          description: acceptData.error || "Неуспешно приемане на поканата",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при приемане на поканата",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" })
      const data = await response.json()

      if (data.success) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
        toast({ title: "Успешно", description: "Всички известия са маркирани като прочетени" })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешна операция",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при операцията",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
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

  const handleMessageNotificationClick = (notification: NotificationWithSender) => {
    if (notification.type === "NEW_MESSAGE" && notification.postId) {
      router.push(`/messages?id=${notification.postId}`)
    }
  }

  if (loading) return <div className="text-center py-8">Зареждане на известия...</div>
  if (error) return <div className="text-center py-8 text-red-500">Грешка: {error}</div>

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Известия</CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Маркирай всички като прочетени
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <p>Все още нямате известия.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center space-x-4 p-3 rounded-lg ${n.read ? "bg-white" : "bg-blue-50"} ${n.type === "NEW_MESSAGE" ? "cursor-pointer" : ""}`}
                onClick={() => (n.type === "NEW_MESSAGE" ? handleMessageNotificationClick(n) : null)}
              >
                <Avatar>
                  <AvatarImage src={n.sender?.image || undefined} alt={n.sender?.name || ""} />
                  <AvatarFallback>{n.sender?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p>
                    <span className="font-semibold">{n.sender?.name}</span> {n.content}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getNotificationIcon(n.type)}
                  {n.type === "FRIEND_REQUEST" && !n.read && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAcceptFriendRequest(n.id, n.postId || "")}
                      >
                        Приеми
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(n.id)}>
                        Откажи
                      </Button>
                    </div>
                  )}
                  {n.type !== "FRIEND_REQUEST" && !n.read && (
                    <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => handleDeleteNotification(n.id)}
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
