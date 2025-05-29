"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import type { PostWithAuthor } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { toggleLike, deletePost } from "@/lib/post-actions"
import { formatDate } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                            PostMedia carousel                              */
/* -------------------------------------------------------------------------- */
interface MediaCarouselProps {
  media: { url: string; type: "IMAGE" | "VIDEO" }[]
  onMediaClick: () => void
}

function MediaCarousel({ media, onMediaClick }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (media.length === 0) return null

  const currentMedia = media[currentIndex]
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((i) => (i === 0 ? media.length - 1 : i - 1))
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((i) => (i === media.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="relative w-full">
      {/* --- media ---- */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[28rem]">
          {currentMedia.type === "IMAGE" ? (
            <img
              src={currentMedia.url || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-contain cursor-pointer bg-black/5"
              onClick={onMediaClick}
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              className="w-full h-full object-contain bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* arrows */}
        {media.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 rounded-full w-8 h-8 sm:w-10 sm:h-10"
              onClick={prev}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 rounded-full w-8 h-8 sm:w-10 sm:h-10"
              onClick={next}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        )}

        {/* index */}
        {media.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs backdrop-blur-sm">
            {currentIndex + 1}/{media.length}
          </div>
        )}
      </div>

      {/* dots */}
      {media.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(i)
              }}
              className={`w-2 h-2 rounded-full ${
                i === currentIndex ? "bg-blue-500 scale-110" : "bg-gray-300 hover:bg-gray-400"
              } transition-all`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Feed                                     */
/* -------------------------------------------------------------------------- */

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

  /* ------------------------------- helpers ------------------------------- */
  const canSee = (post: PostWithAuthor) => {
    if (post.visibility === "PUBLIC") return true
    if (post.visibility === "PRIVATE") return session?.user?.id === post.author.id
    // FRIENDS: assume server already filters; otherwise you’d check isFriend
    return true
  }

  /* ------------------------ initial / paginated load ------------------------ */
  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
    setLoading(true)
    fetchPosts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType])

  useEffect(() => {
    if (page > 1) fetchPosts(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchPosts(pageNum: number) {
    try {
      setLoading(true)
      let apiUrl = `/api/posts?page=${pageNum}&limit=5`
      if (feedType === "popular") apiUrl += "&sort=popular"
      if (feedType === "for-you") apiUrl += "&personalized=true"

      const res = await fetch(apiUrl)
      const data = await res.json()

      if (data.success) {
        setPosts((prev) => (pageNum === 1 ? data.data : [...prev, ...data.data]))
        setHasMore(data.meta.page < data.meta.pages)
      } else {
        setError(data.error || "Неуспешно зареждане на публикации")
      }
    } catch {
      setError("Възникна грешка при зареждане на публикациите")
    } finally {
      setLoading(false)
    }
  }

  /* ----------------------------- like status ----------------------------- */
  useEffect(() => {
    if (!session?.user) return
    posts.forEach(async (post) => {
      try {
        const res = await fetch(`/api/posts/${post.id}/like`)
        const data = await res.json()
        if (data.success && data.data.liked) {
          setLikedPosts((prev) => new Set([...prev, post.id]))
        }
      } catch {}
    })
  }, [posts, session])

  async function handleLike(id: string) {
    if (!session) return router.push("/login")
    try {
      const result = await toggleLike(id)
      if (!result.success) return
      setLikedPosts((prev) => {
        const next = new Set([...prev])
        result.data?.liked ? next.add(id) : next.delete(id)
        return next
      })
      setPosts((p) =>
        p.map((post) =>
          post.id === id
            ? {
                ...post,
                _count: {
                  ...post._count,
                  likes: post._count.likes + (result.data?.liked ? 1 : -1),
                },
              }
            : post,
        ),
      )
    } catch {}
  }

  async function handleDeletePost(id: string) {
    if (!session) return
    try {
      const result = await deletePost(id)
      toast({
        title: result.success ? "Успешно" : "Грешка",
        description: result.success ? "Постът е изтрит" : result.error,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success) setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast({
        title: "Грешка",
        description: "Грешка при изтриване",
        variant: "destructive",
      })
    }
  }

  /* ---------------------------------------------------------------------- */

  const visiblePosts = posts.filter(canSee)

  if (loading && posts.length === 0) return <div className="py-8 text-center">Зареждане на публикации...</div>
  if (error && posts.length === 0) return <div className="py-8 text-center text-red-500">Грешка: {error}</div>
  if (visiblePosts.length === 0) return <div className="py-8 text-center">Няма публикации.</div>

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-2 sm:px-4">
      {visiblePosts.map((post) => {
        const isOwner = session?.user?.id === post.author.id
        const liked = likedPosts.has(post.id)

        async function handleShare(
          post: PostWithAuthor,
          e: React.MouseEvent,
        ) {
          e.stopPropagation()

          const url   = `${window.location.origin}/posts/${post.id}`
          const title = post.author.name
            ? `${post.author.name} в MyApp`
            : "Публикация в MyApp"
          const text  = post.content?.slice(0, 120) ?? ""

          try {
            if (navigator.share) {
              await navigator.share({ title, text, url })
            } else {
              await navigator.clipboard.writeText(url)
              toast({
                title: "Линк копиран",
                description: "Адресът на публикацията е в клипборда",
              })
            }
          } catch {
            toast({
              title: "Грешка",
              description: "Неуспешно споделяне",
              variant: "destructive",
            })
          }
        }

        return (
          <Card
            key={post.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/posts/${post.id}`)}
          >
            <CardContent className="p-4 sm:p-6">
              {/* ----------------------------- header ---------------------------- */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <Link href={`/profile/${post.author.id}`} onClick={(e) => e.stopPropagation()}>
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
                      <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${post.author.id}`}
                      className="font-semibold hover:underline text-sm sm:text-base"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.author.name}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePost(post.id)
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Изтрий
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>Докладвай</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ---------------------------- content ---------------------------- */}
              {post.content && <p className="mb-4 text-sm sm:text-base leading-relaxed">{post.content}</p>}

              {/* ---------------------------- media ----------------------------- */}
              {post.PostMedia?.length > 0 && (
                <div className="mb-4">
                  <MediaCarousel
                    media={post.PostMedia}
                    onMediaClick={() => router.push(`/posts/${post.id}`)}
                  />
                </div>
              )}

              {/* ---------------------------- actions ---------------------------- */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex space-x-1">
                  {/* like */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs sm:text-sm ${liked ? "text-red-500" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(post.id)
                    }}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-current" : ""}`} />
                    {post.showLikes && post._count.likes}
                  </Button>

                  {/* comments */}
                  {post.allowComments && (
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
                      <Link href={`/posts/${post.id}`} onClick={(e) => e.stopPropagation()}>
                        <MessageCircle className="mr-1 h-4 w-4" />
                        {post._count.comments}
                      </Link>
                    </Button>
                  )}
                </div>

                {/* share */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={(e) => handleShare(post, e)}
                >
                  <Share2 className="mr-1 h-4 w-4" />
                  Сподели
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {hasMore && (
        <div className="py-4 text-center">
          <Button onClick={() => setPage((p) => p + 1)} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Зареждане..." : "Зареди още"}
          </Button>
        </div>
      )}
    </div>
  )
}
