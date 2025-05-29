"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!session?.user) return
    const load = async () => {
      try {
        const r = await fetch("/api/conversations/unread-count")
        const { success, data } = await r.json()
        if (success) setUnread(data.count)
      } catch {
        /* ignore */
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [session])

  if (pathname === "/login" || pathname === "/register") return null

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-xl">
          SocialApp
        </Link>

        {session?.user ? (
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/messages">
              <MessageCircle className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link href="/login">Вход</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
