"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Smile, Send, Paperclip, MoreHorizontal, Check, CheckCheck, Edit, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmojiPicker } from "./EmojiPicker"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

type Message = {
  id: string
  content: string
  senderId: string
  sender: {
    id: string
    name: string | null
    image: string | null
  }
  createdAt: string
  updatedAt: string
  isEdited: boolean
  mediaUrl?: string | null
  mediaType?: string | null
  readReceipts: {
    id: string
    userId: string
    readAt: string
    user: {
      id: string
      name: string | null
    }
  }[]
  deletedAt?: string | null
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
    lastActive: "",
  })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isConnected, joinConversation, sendMessage, sendTypingStatus, markMessageAsRead, subscribeToEvent } =
    useSocket()
  const { toast } = useToast()

  const debouncedTypingStatus = useDebounce(isTyping, 500)

  useEffect(() => {
    fetchConversation()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, otherUserTyping])

  useEffect(() => {
    if (isConnected) {
      joinConversation(conversationId)

      // Subscribe to new messages
      const unsubscribeNewMessage = subscribeToEvent("new-message", (message: Message) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => [...prev, message])

          // Mark message as read if it's not from current user
          if (message.senderId !== session?.user?.id) {
            markMessageAsRead({
              messageId: message.id,
              conversationId,
            })
          }
        }
      })

      // Subscribe to typing indicators
      const unsubscribeTyping = subscribeToEvent("user-typing", (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== session?.user?.id) {
          setOtherUserTyping(data.isTyping)
        }
      })

      // Subscribe to read receipts
      const unsubscribeReadReceipt = subscribeToEvent(
        "message-read",
        (data: { messageId: string; userId: string; readAt: string }) => {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === data.messageId) {
                // Check if this read receipt already exists
                const existingReceiptIndex = message.readReceipts.findIndex((receipt) => receipt.userId === data.userId)

                if (existingReceiptIndex !== -1) {
                  // Update existing receipt
                  const updatedReceipts = [...message.readReceipts]
                  updatedReceipts[existingReceiptIndex] = {
                    ...updatedReceipts[existingReceiptIndex],
                    readAt: data.readAt,
                  }
                  return {
                    ...message,
                    readReceipts: updatedReceipts,
                  }
                } else {
                  // Add new receipt
                  return {
                    ...message,
                    readReceipts: [
                      ...message.readReceipts,
                      {
                        id: `temp-${Date.now()}`,
                        userId: data.userId,
                        readAt: data.readAt,
                        user: {
                          id: data.userId,
                          name: participant.name,
                        },
                      },
                    ],
                  }
                }
              }
              return message
            }),
          )
        },
      )

      return () => {
        unsubscribeNewMessage()
        unsubscribeTyping()
        unsubscribeReadReceipt()
      }
    }
  }, [isConnected, conversationId, session?.user?.id, participant.name])

  // Send typing status when user is typing
  useEffect(() => {
    if (isConnected) {
      sendTypingStatus({
        conversationId,
        isTyping: debouncedTypingStatus,
      })
    }
  }, [debouncedTypingStatus, isConnected, conversationId])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.data.messages)
        setParticipant({
          id: data.data.otherUser?.id || "",
          name: data.data.otherUser?.name || "",
          image: data.data.otherUser?.image || null,
          isOnline: data.data.otherUser?.isOnline || false,
          lastActive: data.data.otherUser?.lastActive || "",
        })

        // Mark all unread messages as read
        data.data.messages.forEach((message: Message) => {
          if (
            message.senderId !== session?.user?.id &&
            !message.readReceipts.some((receipt) => receipt.userId === session?.user?.id)
          ) {
            markMessageAsRead({
              messageId: message.id,
              conversationId,
            })
          }
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching conversation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      if (isConnected) {
        // Send via WebSocket for real-time delivery
        sendMessage({
          conversationId,
          content: newMessage,
        })
      } else {
        // Fallback to REST API if WebSocket is not connected
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newMessage }),
        })

        const data = await response.json()

        if (data.success) {
          setMessages([...messages, data.data])
        } else {
          throw new Error(data.error || "Failed to send message")
        }
      }

      // Clear input
      setNewMessage("")
      setShowEmojiPicker(false)
      setIsTyping(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async () => {
    if (!editingMessageId || !editContent.trim()) return

    try {
      const response = await fetch(`/api/messages/${editingMessageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages(messages.map((message) => (message.id === editingMessageId ? data.data : message)))
        setEditingMessageId(null)
        setEditContent("")
      } else {
        throw new Error(data.error || "Failed to edit message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setMessages(
          messages.map((message) =>
            message.id === messageId
              ? { ...message, content: "This message has been deleted", deletedAt: new Date().toISOString() }
              : message,
          ),
        )
      } else {
        throw new Error(data.error || "Failed to delete message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
    setIsTyping(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setIsTyping(true)
  }

  const handleInputBlur = () => {
    setIsTyping(false)
  }

  const startEditMessage = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const getReadStatus = (message: Message) => {
    if (message.senderId !== session?.user?.id) return null

    if (message.readReceipts.some((receipt) => receipt.userId !== session.user.id)) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />
    }

    return <Check className="h-4 w-4" />
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
                ) : participant.lastActive ? (
                  `Last seen ${formatDistanceToNow(new Date(participant.lastActive), { addSuffix: true })}`
                ) : (
                  "Offline"
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
              <DropdownMenuItem>View Профил</DropdownMenuItem>
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
              const isDeleted = !!message.deletedAt

              return (
                <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                      } ${isDeleted ? "opacity-70" : ""}`}
                  >
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-white text-black"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                            className="h-7 bg-white text-black hover:bg-gray-100"
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleEditMessage} className="h-7">
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="break-words">{message.content}</p>
                        {message.mediaUrl && (
                          <div className="mt-2">
                            {message.mediaType?.startsWith("image/") ? (
                              <img
                                src={message.mediaUrl || "/placeholder.svg"}
                                alt="Shared image"
                                className="rounded-md max-h-60 max-w-full"
                              />
                            ) : message.mediaType?.startsWith("video/") ? (
                              <video src={message.mediaUrl} controls className="rounded-md max-h-60 max-w-full" />
                            ) : (
                              <a
                                href={message.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 underline"
                              >
                                View attachment
                              </a>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            {message.isEdited && !isDeleted && "(edited)"}
                          </p>
                          <div className="flex items-center space-x-1">
                            {isOwnMessage && !isDeleted && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-blue-100 hover:text-white hover:bg-blue-600"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditMessage(message)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {getReadStatus(message)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                  <div className="flex space-x-1">
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "600ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
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
              onChange={handleInputChange}
              onBlur={handleInputBlur}
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

