// Файл: MessageChat.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Smile, Send } from "lucide-react"

const messages = [
  { id: 1, sender: "Йоан Д.", content: "Хей, как си?", time: "10:00 ч." },
  { id: 2, sender: "Вие", content: "Добре съм, благодаря! А ти?", time: "10:05 ч." },
  { id: 3, sender: "Йоан Д.", content: "Супер! Планове за уикенда?", time: "10:10 ч." },
]

export default function MessageChat() {
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Изпращане на съобщение:", newMessage)
    setNewMessage("")
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Avatar className="mr-2">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Йоан Д." />
            <AvatarFallback>ЙД</AvatarFallback>
          </Avatar>
          Йоан Д.
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "Вие" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-lg p-2 ${message.sender === "Вие" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                <p>{message.content}</p>
                <p className="text-xs text-gray-500">{message.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            placeholder="Въведете съобщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="button" size="icon" variant="ghost">
            <Smile className="h-4 w-4" />
          </Button>
          <Button type="submit">
            <Send className="mr-2 h-4 w-4" />
            Изпрати
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
