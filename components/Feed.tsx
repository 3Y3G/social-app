// Файл: Feed.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import type { PostWithAuthor } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toggleLike } from "@/lib/post-actions"
import { useSession } from "next-auth/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export default function Feed() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const feedType = searchParams.get("feed") || "latest"
  const { toast } = useToast()

  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
    setLoading(true)
    fetchPosts(1)
  }, [feedType])

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page)
    }
  }, [page])

  useEffect(() => {
    if (session?.user) {
      posts.forEach(async (post) => {
        try {
          const response = await fetch(`/api/posts/${post.id}/like`)
          const data = await response.json()
          if (data.success && data.data.liked) {
            setLikedPosts((prev) => new Set([...prev, post.id]))
          }
        } catch (error) {
          console.error("Грешка при проверка на харесване:", error)
        }
      })
    }
  }, [posts, session])

  const fetchPosts = async (pageNum: number) => {
    try {
      setLoading(true)

      let apiUrl = `/api/posts?page=${pageNum}&limit=5`

      if (feedType === "popular") {
        apiUrl += "&sort=popular"
      } else if (feedType === "for-you") {
        apiUrl += "&personalized=true"
      }

      const response = await fetch(apiUrl)
      const data = await response.json()

      if (data.success) {
        if (pageNum === 1) {
          setPosts(data.data)
        } else {
          setPosts((prev) => [...prev, ...data.data])
        }

        setHasMore(data.meta.page < data.meta.pages)
      } else {
        setError(data.error || "Неуспешно зареждане на публикации")
      }
    } catch (error) {
      setError("Възникна грешка при зареждане на публикациите")
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!session) {
      router.push("/login")
      return
    }

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
      console.error("Грешка при харесване:", error)
    }
  }

  const handleSavePost = async (postId: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "POST",
          postId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Успешно",
          description: "Публикацията е запазена",
        })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно запазване на публикацията",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Грешка при запазване:", error)
      toast({
        title: "Грешка",
        description: "Възникна проблем при запазване на публикацията",
        variant: "destructive",
      })
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  if (loading && posts.length === 0) {
    return <div className="text-center py-8">Зареждане на публикации...</div>
  }

  if (error && posts.length === 0) {
    return <div className="text-center py-8 text-red-500">Грешка: {error}</div>
  }

  if (posts.length === 0) {
    return <div className="text-center py-8">Няма намерени публикации. Бъди първият, който публикува!</div>
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Link href={`/profile/${post.author.id}`}>
                  <Avatar>
                    <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
                    <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                    {post.author.name}
                  </Link>
                  <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSavePost(post.id)}>Запази публикацията</DropdownMenuItem>
                  {session?.user.id === post.author.id && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${post.id}/edit`}>Редактирай</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">Изтрий</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem>Докладвай</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2">
              <p>{post.content}</p>
              {post.image && (
                <img
                  src={post.image || "/placeholder.svg"}
                  alt="Изображение към публикацията"
                  className="mt-2 rounded-lg max-h-96 object-cover"
                />
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
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
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleSavePost(post.id)}>
                  <Bookmark className="mr-1 h-4 w-4" />
                  Запази
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="mr-1 h-4 w-4" />
                  Сподели
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="text-center py-4">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Зареждане..." : "Зареди още"}
          </Button>
        </div>
      )}
    </div>
  )
}
