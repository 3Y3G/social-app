"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { SafeUser } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, UserMinus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FriendsList() {
  const [friends, setFriends] = useState<(SafeUser & { friendshipId: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/friends")
      const data = await response.json()

      if (data.success) {
        setFriends(data.data)
      } else {
        setError(data.error || "Неуспешно зареждане на приятелите")
      }
    } catch (error) {
      setError("Възникна грешка при зареждане на приятелите")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async (friendId: string, friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setFriends(friends.filter((friend) => friend.id !== friendId))
        toast({
          title: "Успешно",
          description: "Приятелят беше премахнат",
        })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно премахване на приятел",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при премахване на приятел",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div className="text-center py-8">Зареждане на приятели...</div>
  if (error) return <div className="text-center py-8 text-red-500">Грешка: {error}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вашите приятели</CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4">Все още нямате приятели.</p>
            <Button onClick={() => router.push("/search?q=")}>Намерете приятели</Button>
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
                        Съобщение
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/profile/${friend.id}`}>Профил</Link>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-500"
                    onClick={() => handleRemoveFriend(friend.id, friend.friendshipId)}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Премахни приятел
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
