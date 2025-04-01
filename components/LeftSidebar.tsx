"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, PlusSquare, Heart, User, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

export default function LeftSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const links = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
    },
    {
      name: "Create",
      href: "/create",
      icon: PlusSquare,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Heart,
    },
    {
      name: "Profile",
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
            <Link href={link.href}>
              <link.icon className="mr-3 h-5 w-5" />
              {link.name}
            </Link>
          </Button>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="justify-start h-12 hover:bg-red-100 hover:text-red-500"
        onClick={() => signOut()}
      >
        <LogOut className="mr-3 h-5 w-5" />
        Logout
      </Button>
    </div>
  )
}

