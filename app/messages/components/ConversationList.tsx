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

type Conversation = {
  id: string
  participantId: string
  participantName: string
  participantImage: string | null
  lastMessage: string
  lastMessageTime: string
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

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      // In a real app, you would fetch conversations from an API
      // For now, we'll use mock data
      const mockConversations: Conversation[] = [
        {
          id: "1",
          participantId: "user1",
          participantName: "Jane Smith",
          participantImage: "/placeholder.svg?height=40&width=40",
          lastMessage: "Hey, how are you doing?",
          lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
          unreadCount: 2,
        },
        {
          id: "2",
          participantId: "user2",
          participantName: "John Doe",
          participantImage: "/placeholder.svg?height=40&width=40",
          lastMessage: "Let's meet tomorrow for coffee",
          lastMessageTime: new Date(Date.now() - 60 * 60000).toISOString(),
          unreadCount: 0,
        },
        {
          id: "3",
          participantId: "user3",
          participantName: "Alice Johnson",
          participantImage: "/placeholder.svg?height=40&width=40",
          lastMessage: "Thanks for your help!",
          lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
          unreadCount: 0,
        },
      ]

      setConversations(mockConversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConversation = (userId: string) => {
    // In a real app, you would create a new conversation via API
    // For now, we'll simulate it
    const newConversation: Conversation = {
      id: `new-${Date.now()}`,
      participantId: userId,
      participantName: "New Contact",
      participantImage: null,
      lastMessage: "Start a conversation",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    }

    setConversations([newConversation, ...conversations])
    onSelectConversation(newConversation.id)
    setIsNewConversationOpen(false)
  }

  const filteredConversations = conversations.filter((conversation) =>
    conversation.participantName.toLowerCase().includes(searchQuery.toLowerCase()),
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
                        src={conversation.participantImage || undefined}
                        alt={conversation.participantName}
                      />
                      <AvatarFallback>{conversation.participantName[0]}</AvatarFallback>
                    </Avatar>
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left truncate">
                    <div className="font-semibold">{conversation.participantName}</div>
                    <div className="text-sm text-gray-500 truncate">{conversation.lastMessage}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
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

