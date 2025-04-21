// Файл: MobileNavigation.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusSquare, Heart, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

export default function MobileNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

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
      name: "Профил",
      href: session?.user?.id ? `/profile/${session.user.id}` : "/login",
      icon: User,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex justify-around items-center h-14">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              pathname === link.href ? "text-black" : "text-gray-500",
            )}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{link.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
