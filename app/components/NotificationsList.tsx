"use client"

import { useState, useEffect } from "react"
import type { NotificationWithSender } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, UserPlus, Check, UserCheck, Bell, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

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
        setError(data.error || "Failed to fetch notifications")
      }
    } catch (error) {
      setError("An error occurred while fetching notifications")
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
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        )
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to mark notification as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while marking notification as read",
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
        setNotifications(notifications.filter((notification) => notification.id !== notificationId))
        toast({
          title: "Success",
          description: "Notification deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete notification",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting notification",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to mark all notifications as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while marking all notifications as read",
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
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) return <div className="text-center py-8">Loading notifications...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications</CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <p>You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center space-x-4 p-3 rounded-lg ${
                  notification.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <Avatar>
                  <AvatarImage src={notification.sender?.image || undefined} alt={notification.sender?.name || ""} />
                  <AvatarFallback>{notification.sender?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p>
                    <span className="font-semibold">{notification.sender?.name}</span> {notification.content}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(notification.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getNotificationIcon(notification.type)}

                  {!notification.read && (
                    <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notification.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => handleDeleteNotification(notification.id)}
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

