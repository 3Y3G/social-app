"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { LogOut, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Don't show header on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-xl">
          SocialApp
        </Link>

        {session?.user ? (
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-3 py-4 border-b">
                    <Avatar>
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                  </div>

                  <div className="flex-1 py-4">
                    <nav className="space-y-2">
                      <Link href="/settings" className="block px-2 py-2 hover:bg-gray-100 rounded-md">
                        Settings
                      </Link>
                      <Link href="/saved" className="block px-2 py-2 hover:bg-gray-100 rounded-md">
                        Saved Posts
                      </Link>
                    </nav>
                  </div>

                  <Button
                    variant="ghost"
                    className="justify-start mt-auto text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link href={`/profile/${session.user.id}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

