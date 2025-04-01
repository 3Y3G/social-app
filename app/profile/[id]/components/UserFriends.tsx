"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle, UserX } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import type { SafeUser } from "@/lib/types"

export default function UserFriends({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const { toast } = useToast()
  const isOwnProfile = session?.user?.id === userId

  useEffect(() => {
    fetchFriends()
  }, [userId])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}/friends`)
      const data = await response.json()

      if (data.success) {
        setFriends(data.data)
      } else {
        setError(data.error || "Failed to fetch friends")
      }
    } catch (error) {
      setError("An error occurred while fetching friends")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setFriends(friends.filter((friend) => friend.id !== friendId))
        toast({
          title: "Success",
          description: "Friend removed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove friend",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while removing friend",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div className="text-center py-8">Loading friends...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isOwnProfile ? "Your Friends" : "Friends"}</CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p>{isOwnProfile ? "You don't have any friends yet." : "This user doesn't have any friends yet."}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="flex flex-col items-center p-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={friend.image || undefined} alt={friend.name || ""} />
                    <AvatarFallback>{friend.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-lg font-semibold">{friend.name}</h3>
                  {friend.occupation && <p className="text-sm text-gray-500">{friend.occupation}</p>}
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/messages/${friend.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/profile/${friend.id}`}>View Profile</Link>
                    </Button>
                  </div>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-500"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Remove Friend
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

