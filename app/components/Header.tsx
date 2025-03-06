"use client";

import { useState } from "react"
import Link from "next/link"
import { Bell, Mail, Search, User, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col space-y-4">
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start">
                    Home
                  </Button>
                </Link>
                <Link href="/friends">
                  <Button variant="ghost" className="w-full justify-start">
                    Friends
                  </Button>
                </Link>
                <Link href="/saved">
                  <Button variant="ghost" className="w-full justify-start">
                    Saved
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="ghost" className="w-full justify-start">
                    Events
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" className="w-full justify-start">
                    Settings
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="text-2xl font-bold text-blue-600">
            SocialApp
          </Link>
        </div>
        <div className="hidden md:block flex-1 px-4">
          <Input type="text" placeholder="Search..." className="max-w-md" startIcon={<Search className="h-4 w-4" />} />
        </div>
        <nav>
          <ul className="flex items-center space-x-4">
            <li className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                <Search className="h-5 w-5" />
              </Button>
            </li>
            <li>
              <Link href="/notifications">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
            </li>
            <li>
              <Link href="/messages">
                <Button variant="ghost" size="icon">
                  <Mail className="h-5 w-5" />
                </Button>
              </Link>
            </li>
            <li>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          </ul>
        </nav>
      </div>
      {isSearchOpen && (
        <div className="md:hidden p-2">
          <Input type="text" placeholder="Search..." className="w-full" startIcon={<Search className="h-4 w-4" />} />
        </div>
      )}
    </header>
  )
}

