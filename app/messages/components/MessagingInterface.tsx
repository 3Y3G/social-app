"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import ConversationList from "./ConversationList"
import ChatWindow from "@/components/ChatWindow"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export default function MessagingInterface() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const isMobile = useMobile()

  const [activeConversation, setActiveConversation] = useState<string | null>(searchParams.get("id"))
  const [showConversationList, setShowConversationList] = useState(!searchParams.get("id") || !isMobile)

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
      if (isMobile) {
        setShowConversationList(false)
      }
    } else {
      router.push("/messages", { scroll: false })
      setShowConversationList(true)
    }
  }, [activeConversation, router, isMobile])

  // Handle back button on mobile
  useEffect(() => {
    const handlePopState = () => {
      const currentId = new URL(window.location.href).searchParams.get("id")
      if (!currentId && activeConversation) {
        setActiveConversation(null)
        setShowConversationList(true)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [activeConversation])

  // Reset view on screen size change
  useEffect(() => {
    if (!isMobile) {
      setShowConversationList(true)
    } else if (activeConversation) {
      setShowConversationList(false)
    }
  }, [isMobile, activeConversation])

  // Hide mobile navigation when chat is open
  useEffect(() => {
    const body = document.body
    if (isMobile && activeConversation && !showConversationList) {
      body.classList.add("hide-mobile-nav")
    } else {
      body.classList.remove("hide-mobile-nav")
    }

    return () => {
      body.classList.remove("hide-mobile-nav")
    }
  }, [isMobile, activeConversation, showConversationList])

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id)
    if (isMobile) {
      setShowConversationList(false)
    }
  }

  const handleBackToList = () => {
    if (isMobile) {
      setShowConversationList(true)
      // Don't clear active conversation to preserve state
      router.push("/messages", { scroll: false })
    }
  }

  if (status === "loading") {
    return <div className="flex-1 text-center py-8">Loading...</div>
  }

  if (!session) {
    return null
  }

  // Calculate height considering both top navbar and bottom mobile navigation
  // Top navbar is typically 4rem (64px), bottom nav is 3.5rem (56px)
  const heightClass = isMobile
    ? activeConversation && !showConversationList
      ? "h-[calc(100vh-4rem)]" // When chat is open, hide mobile nav so only account for top navbar
      : "h-[calc(100vh-7.5rem)]" // Account for both top navbar and bottom mobile nav
    : "h-[calc(100vh-5rem)]" // Desktop - only account for top navbar with some padding

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${heightClass}`}>
      {/* Conversation List - hidden on mobile when viewing a chat */}
      <div
        className={`
          ${isMobile && !showConversationList ? "hidden" : "block"}
          ${isMobile ? "w-full" : "w-full sm:w-80"}
          h-full
        `}
      >
        <ConversationList activeConversation={activeConversation} onSelectConversation={handleSelectConversation} />
      </div>

      {/* Chat Window - hidden on mobile when showing conversation list */}
      <div
        className={`
          ${isMobile && showConversationList ? "hidden" : "block"}
          flex-1 h-full overflow-hidden
        `}
      >
        {activeConversation ? (
          <div className="flex flex-col h-full">
            {isMobile && (
              <div className="bg-white p-2 border-b sticky top-0 z-10">
                <Button variant="ghost" size="sm" onClick={handleBackToList} className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to conversations
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <ChatWindow conversationId={activeConversation} />
            </div>
          </div>
        ) : (
          <Card className="flex-1 flex items-center justify-center p-8 h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Изберете разговор</h2>
              <p className="text-gray-500">Изберете разговор от списъка или започнете нов</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
