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
        setError(data.error || "Failed to fetch user profile")
      }
    } catch (error) {
      setError("An error occurred while fetching user profile")
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
          description: "Friend request sent",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending friend request",
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
          description: "Friend request cancelled",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to cancel friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while cancelling friend request",
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
          description: "Friend request accepted",
        })

        // Force a refresh to update the UI
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to accept friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while accepting friend request",
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
          description: "Friend request rejected",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while rejecting friend request",
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
          description: "Friend removed",
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

  if (loading) return <div className="text-center py-8">Loading profile...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>
  if (!user) return <div className="text-center py-8">User not found</div>

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
            <p className="text-gray-500">{user.occupation || "No occupation set"}</p>
          </div>
          <div className="flex space-x-2">
            {isOwnProfile ? (
              <Button asChild>
                <Link href="/settings">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            ) : (
              <>
                {user.isFriend ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link href={`/messages/${user.id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleRemoveFriend}>
                      <UserX className="mr-2 h-4 w-4" />
                      Remove Friend
                    </Button>
                  </>
                ) : user.friendRequest ? (
                  user.friendRequest.isOutgoing ? (
                    <Button variant="outline" onClick={handleCancelFriendRequest}>
                      <UserX className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleAcceptFriendRequest}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button variant="outline" onClick={handleRejectFriendRequest}>
                        <UserX className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )
                ) : (
                  <Button onClick={handleSendFriendRequest}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
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
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
        <p className="mt-4">{user.bio || "No bio available"}</p>
      </CardContent>
    </Card>
  )
}

