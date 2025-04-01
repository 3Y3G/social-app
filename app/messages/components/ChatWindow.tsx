"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Smile, Send, Paperclip, MoreHorizontal } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmojiPicker } from "./EmojiPicker"

type Message = {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
}

type ChatWindowProps = {
  conversationId: string
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState({
    id: "",
    name: "",
    image: null as string | null,
    isOnline: false,
    lastSeen: "",
  })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversation()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      // In a real app, you would fetch conversation data from an API
      // For now, we'll use mock data

      // Mock participant data
      setParticipant({
        id: "user1",
        name: "Jane Smith",
        image: "/placeholder.svg?height=40&width=40",
        isOnline: true,
        lastSeen: new Date().toISOString(),
      })

      // Mock messages
      const mockMessages: Message[] = [
        {
          id: "1",
          senderId: "user1",
          content: "Hey, how are you?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true,
        },
        {
          id: "2",
          senderId: session?.user?.id || "",
          content: "I'm good, thanks! How about you?",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          isRead: true,
        },
        {
          id: "3",
          senderId: "user1",
          content: "Doing well! Just wanted to check in.",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          isRead: true,
        },
        {
          id: "4",
          senderId: session?.user?.id || "",
          content: "That's nice of you. What have you been up to lately?",
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          isRead: true,
        },
        {
          id: "5",
          senderId: "user1",
          content: "Not much, just working on some projects. How about you?",
          timestamp: new Date(Date.now() - 3200000).toISOString(),
          isRead: true,
        },
      ]

      setMessages(mockMessages)
    } catch (error) {
      console.error("Error fetching conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    // In a real app, you would send the message to an API
    const message: Message = {
      id: `new-${Date.now()}`,
      senderId: session?.user?.id || "",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false,
    }

    setMessages([...messages, message])
    setNewMessage("")
    setShowEmojiPicker(false)
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="mr-2">
              <AvatarImage src={participant.image || undefined} alt={participant.name} />
              <AvatarFallback>{participant.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{participant.name}</CardTitle>
              <p className="text-sm text-gray-500">
                {participant.isOnline ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  `Last seen ${formatDistanceToNow(new Date(participant.lastSeen), { addSuffix: true })}`
                )}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-4">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === session?.user?.id

              return (
                <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="pr-10"
            />
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}
          </div>
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </Card>
  )
}

