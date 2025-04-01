"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const conversations = [
  {
    id: 1,
    name: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Hey, how are you?",
    time: "5m",
  },
  {
    id: 2,
    name: "Jane Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Can we meet tomorrow?",
    time: "1h",
  },
  {
    id: 3,
    name: "Alice Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    lastMessage: "Thanks for your help!",
    time: "2h",
  },
]

export default function MessageList() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)

  return (
    <Card className="w-1/3">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Search messages" className="pl-8" />
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

