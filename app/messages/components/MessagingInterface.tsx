"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import ConversationList from "./ConversationList"
import ChatWindow from "./ChatWindow"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

export default function MessagingInterface() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [activeConversation, setActiveConversation] = useState<string | null>(searchParams.get("id"))

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Update URL when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      router.push(`/messages?id=${activeConversation}`, { scroll: false })
    }
  }, [activeConversation, router])

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id)
  }

  if (status === "loading") {
    return <div className="flex-1 text-center py-8">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex-1 flex gap-4">
      <ConversationList activeConversation={activeConversation} onSelectConversation={handleSelectConversation} />

      {activeConversation ? (
        <ChatWindow conversationId={activeConversation} />
      ) : (
        <Card className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
            <p className="text-gray-500">Choose a conversation from the list or start a new one</p>
          </div>
        </Card>
      )}
    </div>
  )
}

