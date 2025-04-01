"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Flame, UserPlus } from "lucide-react"
import type { SafeUser } from "@/lib/types"

type TrendingTopic = {
  id: string
  name: string
  count: number
}

type OnlineFriend = {
  id: string
  name: string
  image: string | null
  lastActive: string
}

export default function RightSidebar() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [friendSuggestions, setFriendSuggestions] = useState<SafeUser[]>([])
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([])
  const [loading, setLoading] = useState({
    suggestions: true,
    trending: true,
    online: true,
  })

  useEffect(() => {
    if (session) {
      fetchFriendSuggestions()
      fetchOnlineFriends()
    }
    fetchTrendingTopics()
  }, [session])

  const fetchFriendSuggestions = async () => {
    try {
      setLoading((prev) => ({ ...prev, suggestions: true }))
      // In a real app, you would fetch from an API
      // For now, we'll use mock data
      const mockSuggestions = [
        {
          id: "user1",
          name: "Alice Johnson",
          image: "/placeholder.svg?height=40&width=40",
          email: "alice@example.com",
          occupation: "Software Engineer",
          mutualFriends: 5,
        },
        {
          id: "user2",
          name: "Bob Williams",
          image: "/placeholder.svg?height=40&width=40",
          email: "bob@example.com",
          occupation: "Product Manager",
          mutualFriends: 3,
        },
        {
          id: "user3",
          name: "Carol Davis",
          image: "/placeholder.svg?height=40&width=40",
          email: "carol@example.com",
          occupation: "UX Designer",
          mutualFriends: 7,
        },
      ]

      setFriendSuggestions(mockSuggestions)
    } catch (error) {
      console.error("Error fetching friend suggestions:", error)
    } finally {
      setLoading((prev) => ({ ...prev, suggestions: false }))
    }
  }

  const fetchTrendingTopics = async () => {
    try {
      setLoading((prev) => ({ ...prev, trending: true }))
      // In a real app, you would fetch from an API
      // For now, we'll use mock data
      const mockTrending = [
        { id: "topic1", name: "#SummerVibes", count: 1250 },
        { id: "topic2", name: "#TechNews", count: 980 },
        { id: "topic3", name: "#HealthyLiving", count: 875 },
        { id: "topic4", name: "#TravelDreams", count: 750 },
        { id: "topic5", name: "#FoodieFinds", count: 620 },
      ]

      setTrendingTopics(mockTrending)
    } catch (error) {
      console.error("Error fetching trending topics:", error)
    } finally {
      setLoading((prev) => ({ ...prev, trending: false }))
    }
  }

  const fetchOnlineFriends = async () => {
    try {
      setLoading((prev) => ({ ...prev, online: true }))
      // In a real app, you would fetch from an API
      // For now, we'll use mock data
      const mockOnlineFriends = [
        {
          id: "friend1",
          name: "David Brown",
          image: "/placeholder.svg?height=40&width=40",
          lastActive: new Date().toISOString(),
        },
        {
          id: "friend2",
          name: "Eva Martinez",
          image: "/placeholder.svg?height=40&width=40",
          lastActive: new Date().toISOString(),
        },
        {
          id: "friend3",
          name: "Frank Lee",
          image: "/placeholder.svg?height=40&width=40",
          lastActive: new Date().toISOString(),
        },
      ]

      setOnlineFriends(mockOnlineFriends)
    } catch (error) {
      console.error("Error fetching online friends:", error)
    } finally {
      setLoading((prev) => ({ ...prev, online: false }))
    }
  }

  const handleSendFriendRequest = async (userId: string) => {
    if (!session) return

    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientId: userId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Friend request sent",
        })

        // Remove from suggestions
        setFriendSuggestions(friendSuggestions.filter((friend) => friend.id !== userId))
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

  return (
    <aside className="hidden lg:block w-80 space-y-4">
      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Friend Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.suggestions ? (
              <div className="text-center py-2">Loading suggestions...</div>
            ) : friendSuggestions.length === 0 ? (
              <div className="text-center py-2">No suggestions available</div>
            ) : (
              <ul className="space-y-4">
                {friendSuggestions.map((friend) => (
                  <li key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={friend.image || undefined} alt={friend.name || ""} />
                        <AvatarFallback>{friend.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${friend.id}`} className="font-medium hover:underline">
                          {friend.name}
                        </Link>
                        <p className="text-sm text-gray-500">{friend.mutualFriends} mutual friends</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleSendFriendRequest(friend.id)}>
                      <UserPlus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading.trending ? (
            <div className="text-center py-2">Loading trending topics...</div>
          ) : trendingTopics.length === 0 ? (
            <div className="text-center py-2">No trending topics available</div>
          ) : (
            <ul className="space-y-3">
              {trendingTopics.map((topic) => (
                <li key={topic.id} className="flex items-center justify-between">
                  <Link
                    href={`/search?q=${encodeURIComponent(topic.name)}`}
                    className="flex items-center hover:underline"
                  >
                    <Flame className="mr-2 h-4 w-4 text-red-500" />
                    <span className="font-medium">{topic.name}</span>
                  </Link>
                  <span className="text-sm text-gray-500">{topic.count.toLocaleString()} posts</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Online Friends</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.online ? (
              <div className="text-center py-2">Loading online friends...</div>
            ) : onlineFriends.length === 0 ? (
              <div className="text-center py-2">No friends online</div>
            ) : (
              <ul className="space-y-4">
                {onlineFriends.map((friend) => (
                  <li key={friend.id} className="flex items-center justify-between">
                    <Link href={`/profile/${friend.id}`} className="flex items-center space-x-3 hover:underline">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={friend.image || undefined} alt={friend.name} />
                          <AvatarFallback>{friend.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                      </div>
                      <span>{friend.name}</span>
                    </Link>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/messages?id=${friend.id}`}>Message</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sponsored</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <img src="/placeholder.svg?height=200&width=300" alt="Sponsored content" className="rounded-lg" />
            <p className="text-sm">Experience the new XYZ product - Revolutionizing your daily life!</p>
            <Button className="w-full">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

