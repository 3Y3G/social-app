"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart, MessageCircle, MessageSquare, Share2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { PostWithAuthor } from "@/lib/types"
import { useSession } from "next-auth/react"
import { toggleLike } from "@/lib/post-actions"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

export default function UserPosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const router = useRouter()
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
        if (result.data?.liked) {
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
  
  function openPost(id: string) {
    router.push(`/posts/${id}`)
  }
  console.log(posts)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Публикации</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8">No posts yet</div>
        ) : (
          <div className="space-y-4">
                  {posts.map((post) => (
        <Card key={post.id} className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback>{post.author.name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <div className="text-sm font-semibold">{post.author.name}</div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-sm text-gray-700 mb-3">{post.content}</p>

            {post.PostMedia && post.PostMedia.length > 0 && (
              <MediaCarousel media={post.PostMedia} onMediaClick={() => openPost(post.id)} />
            )}
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


interface MediaCarouselProps {
  media: { url: string; type: "IMAGE" | "VIDEO" }[]
  onMediaClick: () => void
}

function MediaCarousel({ media, onMediaClick }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  if (media.length === 0) return null

  const currentMedia = media[currentIndex]

  return (
    <div className="relative">
      {/* Main media display */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <div className="flex items-center justify-center h-64 sm:h-80 md:h-96 lg:h-[28rem]">
          {currentMedia.type === "IMAGE" ? (
            <img
              src={currentMedia.url || "/placeholder.svg"}
              alt="Post media"
              className="max-h-full max-w-full object-contain cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={onMediaClick}
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              className="max-h-full max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* Navigation arrows - only show if more than 1 media item */}
        {media.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 rounded-full h-8 w-8 sm:h-10 sm:w-10 transition-all duration-200"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 rounded-full h-8 w-8 sm:h-10 sm:w-10 transition-all duration-200"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        )}

        {/* Media counter */}
        {media.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Pagination dots - only show if more than 1 media item */}
      {media.length > 1 && (
        <div className="flex justify-center mt-3 space-x-1.5">
          {media.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 hover:scale-125 ${
                index === currentIndex ? "bg-blue-500 scale-110" : "bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={(e) => goToSlide(index, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
