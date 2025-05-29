"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import ConversationList from "./ConversationList"
import ChatWindow from "@/components/ChatWindow"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

/**
 * MessagingInterface
 * ------------------
 * The chat area now owns its own scroll (overflow‑y‑auto) so that the
 * rest of the layout stays fixed.  The outer flex container is given
 * `overflow-hidden` to prevent the browser from falling back to full‑page
 * scrolling, and `min-h-0` is used on flex children so that the browser
 * allows them to shrink and respect the overflow settings.
 */
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
    /*
     * Make sure the content area itself never overflows the viewport.
     *  - `overflow-hidden` prevents the browser from adding a scrollbar to
     *    the <body>.
     *  - `min-h-0` on flex children lets them shrink so the overflow on
     *    ChatWindow can take effect.
     */
    <div className="flex-1 flex gap-4 overflow-hidden h-[calc(100vh-4rem)]"> {/* adjust 4rem to your header height if needed */}
      <ConversationList
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
      />

      {activeConversation ? (
        /*
         * ChatWindow wrapper — owns the vertical scroll bar.
         */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ChatWindow conversationId={activeConversation} />
        </div>
      ) : (
        <Card className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Изберете разговор</h2>
            <p className="text-gray-500">Изберете разговор от списъка или започнете нов</p>
          </div>
        </Card>
      )}
    </div>
  )
}
