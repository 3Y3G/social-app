"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import NewConversationForm from "./NewConversationForm"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"

type Conversation = {
  id: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
    isOnline: boolean
    lastActive: string | null
  } | null
  lastMessage: {
    id: string
    content: string
    senderId: string
    senderName: string | null
    createdAt: string
  } | null
  unreadCount: number
}

type ConversationListProps = {
  activeConversation: string | null
  onSelectConversation: (id: string) => void
}

export default function ConversationList({ activeConversation, onSelectConversation }: ConversationListProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const { isConnected, subscribeToEvent } = useSocket()
  const { toast } = useToast()

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (isConnected) {
      // Subscribe to new message notifications
      const unsubscribe = subscribeToEvent("notification", (data: any) => {
        if (data.type === "NEW_MESSAGE") {
          // Update the conversation with the new message
          setConversations((prevConversations) => {
            const updatedConversations = [...prevConversations]
            const conversationIndex = updatedConversations.findIndex((c) => c.id === data.message.conversationId)

            if (conversationIndex !== -1) {
              // Update existing conversation
              const conversation = { ...updatedConversations[conversationIndex] }
              conversation.lastMessage = {
                id: data.message.id,
                content: data.message.content,
                senderId: data.message.senderId,
                senderName: data.message.sender.name,
                createdAt: data.message.createdAt,
              }
              conversation.unreadCount += 1

              // Move conversation to top
              updatedConversations.splice(conversationIndex, 1)
              updatedConversations.unshift(conversation)
            } else {
              // Fetch the new conversation
              fetchConversations()
            }

            return updatedConversations
          })

          // Show toast notification if the conversation is not active
          if (data.message.conversationId !== activeConversation) {
            toast({
              title: `New message from ${data.message.sender.name}`,
              description: data.message.content.substring(0, 50) + (data.message.content.length > 50 ? "..." : ""),
            })
          }
        }
      })

      return unsubscribe
    }
  }, [isConnected, activeConversation, toast])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/conversations")
      const data = await response.json()

      if (data.success) {
        setConversations(data.data)
      } else {
        console.error("Error fetching conversations:", data.error)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConversation = async (userId: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantId: userId }),
      })

      const data = await response.json()

      if (data.success) {
        // Check if conversation already exists in the list
        const existingIndex = conversations.findIndex((c) => c.id === data.data.id)

        if (existingIndex === -1) {
          // Add new conversation to the list
          setConversations([
            {
              id: data.data.id,
              otherUser: data.data.otherUser,
              lastMessage: null,
              unreadCount: 0,
            },
            ...conversations,
          ])
        }

        onSelectConversation(data.data.id)
        setIsNewConversationOpen(false)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating conversation",
        variant: "destructive",
      })
    }
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="w-80">
      <CardHeader className="space-y-4">
        <CardTitle>Messages</CardTitle>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search messages"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Conversation</DialogTitle>
              </DialogHeader>
              <NewConversationForm onCreateConversation={handleCreateConversation} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No conversations found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={`w-full justify-start ${activeConversation === conversation.id ? "bg-gray-100" : ""}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center w-full">
                  <div className="relative">
                    <Avatar className="mr-2">
                      <AvatarImage
                        src={conversation.otherUser?.image || undefined}
                        alt={conversation.otherUser?.name || ""}
                      />
                      <AvatarFallback>{conversation.otherUser?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    {conversation.otherUser?.isOnline && (
                      <span className="absolute -bottom-1 right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left truncate">
                    <div className="font-semibold">{conversation.otherUser?.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === session?.user?.id ? "You:" : ""}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        "Start a conversation"
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {conversation.lastMessage
                      ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
                      : "New"}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

