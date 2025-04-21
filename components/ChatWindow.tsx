"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Smile, Send, Paperclip, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmojiPicker } from "@/app/messages/components/EmojiPicker"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { MessageStatus } from "@/components/MessageStatus"

type Message = {
  conversationId: string
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
  deliveryStatus: string // "PENDING", "SENT", "DELIVERED", "READ"
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
  const [deliveryReceipts, setDeliveryReceipts] = useState<Record<string, boolean>>({})
  const [pendingMessages, setPendingMessages] = useState<Record<string, boolean>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  const debouncedTypingStatus = useDebounce(isTyping, 500)

  // Add this function to handle fallback for message status updates
  const updateMessageStatus = async (messageId: string, status: "DELIVERED" | "READ") => {
    if (!session?.user?.id) return

    try {

      if (isConnected) {
        // If connected via WebSocket, use that
        if (status === "READ") {
          markMessageAsRead({
            messageId,
            conversationId,
          })
        } else if (status === "DELIVERED") {
          // For DELIVERED status, we need to manually emit an event
          // since the socket server only handles it automatically when joining a conversation
          const response = await fetch(`/api/messages/${messageId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "DELIVERED" }),
          })

          if (!response.ok) {
            throw new Error("Failed to update message status")
          }
        }
      } else {
        // Fallback to REST API
        const response = await fetch(`/api/messages/${messageId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        })

        if (!response.ok) {
          throw new Error("Failed to update message status")
        }
      }
    } catch (error) {
      console.error(`Error updating message ${status} status:`, error)
    }
  }

  useEffect(() => {
    fetchConversation()

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, otherUserTyping])

  // Set up the intersection observer for message visibility
  useEffect(() => {
    if (!session?.user?.id || messages.length === 0) return

    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create a new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id")
            const senderId = entry.target.getAttribute("data-sender-id")

            // Only mark other users' messages as read
            if (messageId && senderId && senderId !== session.user.id) {
              updateMessageStatus(messageId, "READ")

              // Unobserve after marking as read
              if (observerRef.current) {
                observerRef.current.unobserve(entry.target)
              }
            }
          }
        })
      },
      { threshold: 0.5 },
    )

    // Observe all message elements
    setTimeout(() => {
      const messageElements = document.querySelectorAll("[data-message-id]")
      messageElements.forEach((element) => {
        const senderId = element.getAttribute("data-sender-id")
        if (senderId !== session.user.id) {
          observerRef.current?.observe(element)
        }
      })
    }, 500) // Small delay to ensure DOM is ready
  }, [messages, session?.user?.id])

  useEffect(() => {
    if (isConnected) {
      joinConversation(conversationId)

      // Subscribe to new messages
      const unsubscribeNewMessage = subscribeToEvent("new-message", (message: Message) => {
        if (message.conversationId === conversationId) {

          // If this is a message we sent that was pending, update its status
          setMessages((prev) => {
            const updatedMessages = [...prev]

            // Check if this is a response to a pending message we sent
            const pendingIndex = updatedMessages.findIndex(
              (m) => m.content === message.content && m.senderId === message.senderId && m.deliveryStatus === "PENDING",
            )

            if (pendingIndex !== -1) {
              // Replace the pending message with the confirmed one
              updatedMessages[pendingIndex] = message
              // Also remove from pending messages state
              setPendingMessages((prev) => {
                const updated = { ...prev }
                delete updated[updatedMessages[pendingIndex].id]
                return updated
              })
            } else {
              // This is a new message, add it
              updatedMessages.push(message)
            }

            return updatedMessages
          })

          // Mark message as delivered if it's not from current user
          if (message.senderId !== session?.user?.id) {
            updateMessageStatus(message.id, "DELIVERED")
          }
        }
      })

      // Subscribe to message delivery status
      const unsubscribeDelivery = subscribeToEvent(
        "message-delivered",
        (data: { messageId: string; userId?: string; deliveredAt: string; deliveredToAll?: boolean }) => {

          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === data.messageId) {
                return {
                  ...message,
                  deliveryStatus: "DELIVERED",
                }
              }
              return message
            }),
          )

          // Update delivery receipts
          setDeliveryReceipts((prev) => ({
            ...prev,
            [data.messageId]: true,
          }))

          // Remove from pending if it was pending
          setPendingMessages((prev) => {
            if (prev[data.messageId]) {
              const updated = { ...prev }
              delete updated[data.messageId]
              return updated
            }
            return prev
          })
        },
      )

      // Subscribe to message read status
      const unsubscribeReadByUser = subscribeToEvent(
        "message-read-by-user",
        (data: { messageId: string; userId: string; readAt: string }) => {

          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === data.messageId) {
                // Check if this completes all reads
                const updatedMessage = { ...message }

                // Add the read receipt if it doesn't exist
                const existingReceiptIndex = updatedMessage.readReceipts.findIndex(
                  (receipt) => receipt.userId === data.userId,
                )

                if (existingReceiptIndex === -1) {
                  updatedMessage.readReceipts = [
                    ...updatedMessage.readReceipts,
                    {
                      id: `temp-${Date.now()}`,
                      userId: data.userId,
                      readAt: data.readAt,
                      user: {
                        id: data.userId,
                        name: participant.name,
                      },
                    },
                  ]
                }

                // If all participants have read, update status
                if (updatedMessage.readReceipts.length >= 1) {
                  // At least one other person has read it
                  updatedMessage.deliveryStatus = "READ"
                }

                return updatedMessage
              }
              return message
            }),
          )
        },
      )

      // Subscribe to message read events
      const unsubscribeRead = subscribeToEvent(
        "message-read",
        (data: { messageId: string; userId: string; readAt: string }) => {

          setMessages((prev) =>
            prev.map((message) => {
              if (message.id === data.messageId) {
                // Update read receipts for the message
                const updatedMessage = { ...message }
                const existingReceiptIndex = updatedMessage.readReceipts.findIndex(
                  (receipt) => receipt.userId === data.userId,
                )

                if (existingReceiptIndex === -1) {
                  updatedMessage.readReceipts = [
                    ...updatedMessage.readReceipts,
                    {
                      id: `temp-${Date.now()}`,
                      userId: data.userId,
                      readAt: data.readAt,
                      user: {
                        id: data.userId,
                        name: participant.name,
                      },
                    },
                  ]
                }

                // Update status to READ if this is a message we sent
                if (updatedMessage.senderId === session?.user?.id) {
                  updatedMessage.deliveryStatus = "READ"
                }

                return updatedMessage
              }
              return message
            }),
          )
        },
      )

      // Subscribe to typing indicator
      const unsubscribeTyping = subscribeToEvent("user-typing", (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== session?.user?.id) {
          setOtherUserTyping(data.isTyping)
        }
      })

      return () => {
        unsubscribeNewMessage()
        unsubscribeTyping()
        unsubscribeRead()
        unsubscribeDelivery()
        unsubscribeReadByUser()
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

  // In the fetchConversation function, update to mark messages as delivered and read
  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()
      console.log("response: ", data.data)
      if (data.success) {
        // Ensure each message has a deliveryStatus
        const processedMessages = data.data.messages.map((message: any) => {
          // has anyone _other than_ me read this yet?
          const hasBeenReadByOther = message.readReceipts.some(
            (r: any) => r.userId !== session?.user?.id
          );

          return {
            ...message,
            deliveryStatus: hasBeenReadByOther
              ? "READ"
              : message.deliveryStatus || "SENT",
          };
        });

        setMessages(processedMessages)
        setParticipant({
          id: data.data.otherUser?.id || "",
          name: data.data.otherUser?.name || "",
          image: data.data.otherUser?.image || null,
          isOnline: data.data.otherUser?.isOnline || false,
          lastActive: data.data.otherUser?.lastActive || "",
        })

        // Mark all messages from other users as delivered
        processedMessages.forEach((message: Message) => {
          if (message.senderId !== session?.user?.id) {
            updateMessageStatus(message.id, "DELIVERED")
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
      // Create a temporary message to display immediately
      const tempId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempId,
        conversationId,
        content: newMessage,
        senderId: session?.user?.id || "",
        sender: {
          id: session?.user?.id || "",
          name: session?.user?.name || "",
          image: session?.user?.image || null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
        deliveryStatus: "PENDING", // Start with PENDING status
        readReceipts: [],
      }

      // Add the temporary message to the UI
      setMessages([...messages, tempMessage])
      // Track this message as pending
      setPendingMessages({
        ...pendingMessages,
        [tempId]: true,
      })

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
          // Replace the temp message with the real one
          setMessages((messages) =>
            messages.map((msg) => (msg.id === tempId ? { ...data.data, deliveryStatus: "SENT" } : msg)),
          )
          // Remove from pending messages
          setPendingMessages((prev) => {
            const updated = { ...prev }
            delete updated[tempId]
            return updated
          })
        } else {
          throw new Error(data.error || "Failed to send message")
        }
      }

      // Clear input
      setNewMessage("")
      setShowEmojiPicker(false)
      setIsTyping(false)
    } catch (error) {
      // Mark the message as failed
      setMessages((messages) =>
        messages.map((msg) => {
          if (pendingMessages[msg.id]) {
            return { ...msg, content: msg.content + " (Failed to send)", deliveryStatus: "SENT" }
          }
          return msg
        }),
      )

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
        setMessages(
          messages.map((message) =>
            message.id === editingMessageId
              ? {
                ...data.data,
                deliveryStatus: message.deliveryStatus, // Preserve the delivery status
              }
              : message,
          ),
        )
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

  const getMessageStatusComponent = (message: Message) => {
    const currentUserId = session?.user?.id;
    if (!currentUserId || message.senderId !== currentUserId) {
      return null;
    }

    // Don’t show status on deleted messages
    if (message.deletedAt) {
      return null;
    }
    // If the message has been read by at least one other user, show “Seen”
    if (message.deliveryStatus === "READ") {
      return <span className="text-xs text-blue-100 ml-1">Seen</span>;
    }

    // Otherwise, render the default MessageStatus
    const readBy = (message.readReceipts || [])
      .filter((receipt) => receipt.userId !== currentUserId)
      .map((receipt) => receipt.user);

    return (
      <MessageStatus
        status={pendingMessages[message.id] ? "PENDING" : message.deliveryStatus}
        readBy={readBy}
        className="text-blue-100"
      />
    );
  };

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
              const isDeleted = !!message.deletedAt

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  data-message-id={message.id}
                  data-sender-id={message.senderId}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                      } ${isDeleted ? "opacity-70" : ""} ${pendingMessages[message.id] ? "opacity-80" : ""}`}
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
                            {pendingMessages[message.id]
                              ? "Sending..."
                              : formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            {message.isEdited && !isDeleted && " (edited)"}
                          </p>
                          <div className="flex items-center space-x-1">
                            {isOwnMessage && !isDeleted && !pendingMessages[message.id] && (
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
                            {getMessageStatusComponent(message)}
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
