import Link from "next/link"
import { Home, Users, Bookmark, Calendar, Settings, HelpCircle, MessageCircle, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LeftSidebar() {
  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Friends", href: "/friends" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Bookmark, label: "Saved", href: "/saved" },
    { icon: Calendar, label: "Events", href: "/events" },
    { icon: Video, label: "Watch", href: "/watch" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: HelpCircle, label: "Help & Support", href: "/help" },
  ]

  return (
    <aside className="w-64 space-y-4">
      {menuItems.map((item, index) => (
        <Link key={index} href={item.href} passHref>
          <Button variant="ghost" className="w-full justify-start">
            <item.icon className="mr-2 h-5 w-5" />
            {item.label}
          </Button>
        </Link>
      ))}
    </aside>
  )
}

