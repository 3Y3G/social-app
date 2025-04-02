"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type User = {
  id: string
  name: string | null
  image: string | null
}

export default function RightSidebar() {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await fetch("/api/users/suggested")
        const data = await response.json()

        if (data.success) {
          setSuggestedUsers(data.data)
        }
      } catch (error) {
        console.error("Error fetching suggested users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestedUsers()
  }, [])

  return (
    <div className="hidden lg:block w-[320px] p-4 sticky top-0 h-screen overflow-y-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Suggested for you</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium">{user.name}</div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/profile/${user.id}`}>View</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-xs text-gray-500">
        <div className="flex flex-wrap gap-2 mb-3">
          <Link href="#" className="hover:underline">
            About
          </Link>
          <Link href="#" className="hover:underline">
            Help
          </Link>
          <Link href="#" className="hover:underline">
            Privacy
          </Link>
          <Link href="#" className="hover:underline">
            Terms
          </Link>
        </div>
        <p>© 2023 SocialApp</p>
      </div>
    </div>
  )
}

