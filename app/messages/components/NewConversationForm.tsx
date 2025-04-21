"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Търсене } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import type { SafeUser } from "@/lib/types"

type NewConversationFormProps = {
  onCreateConversation: (userId: string) => void
}

export default function NewConversationForm({ onCreateConversation }: NewConversationFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`)
      const data = await response.json()

      if (data.success) {
        // Filter out the current user
        const filteredResults = data.data.users.filter((user: SafeUser) => user.id !== session?.user?.id)
        setSearchResults(filteredResults)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to search users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while searching users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Търсене className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Търсене for users"
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">Searching...</div>
        ) : searchResults.length === 0 ? (
          searchQuery.trim().length >= 2 ? (
            <div className="text-center py-4">No users found</div>
          ) : (
            <div className="text-center py-4">Type at least 2 characters to search</div>
          )
        ) : (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onCreateConversation(user.id)}
              >
                <Avatar className="mr-2">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-semibold">{user.name}</div>
                  {user.email && <div className="text-sm text-gray-500">{user.email}</div>}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

