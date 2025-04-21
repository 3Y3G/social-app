// Файл: MessageList.tsx
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react" // поправен импорт

const conversations = [
  {
    id: 1,
    name: "Йоан Д.",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Хей, как си?",
    time: "преди 5 мин",
  },
  {
    id: 2,
    name: "Жана С.",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Можем ли да се видим утре?",
    time: "преди 1 ч.",
  },
  {
    id: 3,
    name: "Алис Дж.",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Благодаря за помощта!",
    time: "преди 2 ч.",
  },
]

export default function MessageList() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)

  return (
    <Card className="w-1/3">
      <CardHeader>
        <CardTitle>Съобщения</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Търсене на съобщения..." className="pl-8" />
        </div>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant="ghost"
              className={`w-full justify-start ${selectedConversation === conversation.id ? "bg-gray-100" : ""}`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <Avatar className="mr-2">
                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                <AvatarFallback>{conversation.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-semibold">{conversation.name}</div>
                <div className="text-sm text-gray-500">{conversation.lastMessage}</div>
              </div>
              <div className="text-xs text-gray-500">{conversation.time}</div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
