// Файл: LeftSidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusSquare, Heart, User, LogOut, MessageCircle } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

export default function LeftSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    if (session?.user) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/conversations/unread-count")
          const data = await response.json()

          if (data.success) {
            setUnreadMessageCount(data.data.count)
          }
        } catch (error) {
          console.error("Грешка при зареждане на непрочетени съобщения:", error)
        }
      }

      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const links = [
    {
      name: "Начало",
      href: "/",
      icon: Home,
    },
    {
      name: "Търсене",
      href: "/search",
      icon: Search,
    },
    {
      name: "Създай",
      href: "/create",
      icon: PlusSquare,
    },
    {
      name: "Известия",
      href: "/notifications",
      icon: Heart,
    },
    {
      name: "Съобщения",
      href: "/messages",
      icon: MessageCircle,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      name: "Профил",
      href: session?.user?.id ? `/profile/${session.user.id}` : "/login",
      icon: User,
    },
  ]

  return (
    <div className="hidden md:flex flex-col h-screen sticky top-0 p-4 border-r w-[240px] space-y-4">
      <div className="py-2">
        <h1 className="text-xl font-bold">SocialApp</h1>
      </div>

      <nav className="flex flex-col space-y-1 flex-1">
        {links.map((link) => (
          <Button
            key={link.name}
            variant="ghost"
            className={cn("justify-start h-12", pathname === link.href && "bg-neutral-100 dark:bg-neutral-800")}
            asChild
          >
            <Link href={link.href} className="relative">
              <link.icon className="mr-3 h-5 w-5" />
              {link.name}
              {link.badge && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              )}
            </Link>
          </Button>
        ))}
      </nav>

      {session?.user && (
        <div className="flex items-center space-x-3 mb-6">
          <Avatar>
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        className="justify-start h-12 hover:bg-red-100 hover:text-red-500"
        onClick={() => signOut()}
      >
        <LogOut className="mr-3 h-5 w-5" />
        Изход
      </Button>
    </div>
  )
}
