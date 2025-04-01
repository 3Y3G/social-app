"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { PostWithAuthor } from "@/lib/types"
import { useSession } from "next-auth/react"
import { toggleLike } from "@/lib/post-actions"

export default function UserPosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const { data: session } = useSession()

  useEffect(() => {
    fetchPosts()
  }, [userId, page])

  useEffect(() => {
    if (session?.user) {
      // Check which posts are liked by the user
      posts.forEach(async (post) => {
        try {
          const response = await fetch(`/api/posts/${post.id}/like`)
          const data = await response.json()
          if (data.success && data.data.liked) {
            setLikedPosts((prev) => new Set([...prev, post.id]))
          }
        } catch (error) {
          console.error("Error checking like status:", error)
        }
      })
    }
  }, [posts, session])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}/posts?page=${page}&limit=5`)
      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setPosts(data.data)
        } else {
          setPosts((prev) => [...prev, ...data.data])
        }

        setHasMore(data.meta.page < data.meta.pages)
      } else {
        setError(data.error || "Failed to fetch posts")
      }
    } catch (error) {
      setError("An error occurred while fetching posts")
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!session) return

    try {
      const result = await toggleLike(postId)
      if (result.success) {
        if (result.data.liked) {
          setLikedPosts((prev) => new Set([...prev, postId]))
          setPosts(
            posts.map((post) =>
              post.id === postId ? { ...post, _count: { ...post._count, likes: post._count.likes + 1 } } : post,
            ),
          )
        } else {
          setLikedPosts((prev) => {
            const newSet = new Set([...prev])
            newSet.delete(postId)
            return newSet
          })
          setPosts(
            posts.map((post) =>
              post.id === postId ? { ...post, _count: { ...post._count, likes: post._count.likes - 1 } } : post,
            ),
          )
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  if (loading && posts.length === 0) {
    return <div className="text-center py-8">Loading posts...</div>
  }

  if (error && posts.length === 0) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8">No posts yet</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
                      <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div>
                        <span className="font-semibold">{post.author.name}</span>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                      <p className="mt-2">{post.content}</p>
                      {post.image && (
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt="Post image"
                          className="mt-2 rounded-lg max-h-96 object-cover"
                        />
                      )}
                      <div className="mt-4 flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={likedPosts.has(post.id) ? "text-red-500" : ""}
                        >
                          <Heart className={`mr-1 h-4 w-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                          {post._count.likes}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/posts/${post.id}`}>
                            <MessageCircle className="mr-1 h-4 w-4" />
                            {post._count.comments}
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="mr-1 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <Button onClick={loadMore} disabled={loading}>
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

