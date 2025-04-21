"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, MapPin, Briefcase, Calendar, UserPlus, UserCheck, UserX, MessageCircle } from "lucide-react"
import type { SafeUser } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfileHeader({ userId }: { userId?: string }) {
  const { data: session } = useSession()
  const [user, setUser] = useState<
    | (SafeUser & {
        isFriend?: boolean
        friendRequest?: { id: string; status: string; isOutgoing: boolean } | null
      })
    | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // If userId is not provided, use the current user's ID
  const profileId = userId || session?.user?.id

  useEffect(() => {
    if (!profileId) return

    fetchUserProfile()
  }, [profileId, session])

  // Update the fetchUserProfile function to properly handle the response
  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const endpoint = userId ? `/api/users/${profileId}` : "/api/users/me"
      const response = await fetch(endpoint)
      const data = await response.json()

      if (data.success) {
        setUser(data.data)
      } else {
        setError(data.error || "Неуспешно извличане на потребителския профил")
      }
    } catch (error) {
      setError("Възникна грешка при извличането на потребителския профил")
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientId: profileId }),
      })

      const data = await response.json()

      if (data.success) {
        setUser({
          ...user!,
          friendRequest: {
            id: data.data.id,
            status: "PENDING",
            isOutgoing: true,
          },
        })
        toast({
          title: "Success",
          description: "Молбата за приятелство е изпратена",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Неуспешно изпращане на покана за приятелство",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Възникна грешка при изпращане на покана за приятелство",
        variant: "destructive",
      })
    }
  }

  const handleCancelFriendRequest = async () => {
    if (!user?.friendRequest?.id) return

    try {
      const response = await fetch(`/api/friends/requests/${user.friendRequest.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setUser({
          ...user,
          friendRequest: null,
        })
        toast({
          title: "Success",
          description: "Молбата за приятелство е анулирана",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Неуспешно анулиране на заявка за приятелство",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Възникна грешка при анулирането на заявката за при��телство",
        variant: "destructive",
      })
    }
  }

  // Update the handleAcceptFriendRequest function to properly refresh the UI
  const handleAcceptFriendRequest = async () => {
    if (!user?.friendRequest?.id) return

    try {
      const response = await fetch(`/api/friends/requests/${user.friendRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "accept" }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state immediately
        setUser({
          ...user,
          isFriend: true,
          friendRequest: null,
        })

        toast({
          title: "Success",
          description: "Молбата за приятелство е приета",
        })

        // Force a refresh to update the UI
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: data.error || "Неуспешно приемане на заявка за приятелство",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Възникна грешка при приемане на покана за приятелство",
        variant: "destructive",
      })
    }
  }

  const handleRejectFriendRequest = async () => {
    if (!user?.friendRequest?.id) return

    try {
      const response = await fetch(`/api/friends/requests/${user.friendRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      })

      const data = await response.json()

      if (data.success) {
        setUser({
          ...user,
          friendRequest: null,
        })
        toast({
          title: "Success",
          description: "Молбата за приятелство е отхвърлена",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Неуспешно отхвърляне на молбата за приятелство",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Възникна грешка при отхвърляне на молбата за приятелство",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFriend = async () => {
    if (!profileId) return

    try {
      const response = await fetch(`/api/friends/${profileId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setUser({
          ...user!,
          isFriend: false,
        })
        toast({
          title: "Success",
          description: "Приятел премахнат",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Неуспешно премахване на приятел",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Възникна грешка при премахването на приятел",
        variant: "destructive",
      })
    }
  }

  if (loading) return <div className="text-center py-8">Профилът се зарежда...</div>
  if (error) return <div className="text-center py-8 text-red-500">Грешка: {error}</div>
  if (!user) return <div className="text-center py-8">Потребителят не е намерен</div>

  const isOwnProfile = session?.user?.id === profileId

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          <img
            src={user.coverImage || "/placeholder.svg?height=200&width=1000"}
            alt="Cover"
            className="h-48 w-full rounded-lg object-cover"
          />
          <Avatar className="absolute bottom-0 left-4 -mb-16 h-32 w-32 border-4 border-white">
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-16 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-500">{user.occupation || "Няма зададена професия"}</p>
          </div>
          <div className="flex space-x-2">
            {isOwnProfile ? (
              <Button asChild>
                <Link href="/settings">
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактиране на профил
                </Link>
              </Button>
            ) : (
              <>
                {user.isFriend ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link href={`/messages/${user.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Съобщение
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleRemoveFriend}>
                      <UserX className="mr-2 h-4 w-4" />
                      Премахване на приятел
                    </Button>
                  </>
                ) : user.friendRequest ? (
                  user.friendRequest.isOutgoing ? (
                    <Button variant="outline" onClick={handleCancelFriendRequest}>
                      <UserX className="mr-2 h-4 w-4" />
                      Отказ на заявка
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleAcceptFriendRequest}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Приеми
                      </Button>
                      <Button variant="outline" onClick={handleRejectFriendRequest}>
                        <UserX className="mr-2 h-4 w-4" />
                        Отхвърляне
                      </Button>
                    </>
                  )
                ) : (
                  <Button onClick={handleSendFriendRequest}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Добавяне на приятел
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-gray-500">
          {user.location && (
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              {user.location}
            </div>
          )}
          {user.occupation && (
            <div className="flex items-center">
              <Briefcase className="mr-1 h-4 w-4" />
              {user.occupation}
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            Присъедини се на {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
        <p className="mt-4">{user.bio || "Няма налична биография"}</p>
      </CardContent>
    </Card>
  )
}
