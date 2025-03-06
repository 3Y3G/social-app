import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, UserPlus } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "like",
    user: "Alice Johnson",
    content: "liked your post",
    time: "5m ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    type: "comment",
    user: "Bob Williams",
    content: "commented on your photo",
    time: "1h ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    type: "friend",
    user: "Carol Davis",
    content: "sent you a friend request",
    time: "2h ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function NotificationsList() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={notification.avatar} alt={notification.user} />
                <AvatarFallback>{notification.user[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p>
                  <span className="font-semibold">{notification.user}</span> {notification.content}
                </p>
                <p className="text-sm text-gray-500">{notification.time}</p>
              </div>
              {notification.type === "like" && <Heart className="h-5 w-5 text-red-500" />}
              {notification.type === "comment" && <MessageCircle className="h-5 w-5 text-blue-500" />}
              {notification.type === "friend" && (
                <div className="space-x-2">
                  <Button size="sm" variant="outline">
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost">
                    Decline
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

