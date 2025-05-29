"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Share2, MoreHorizontal, Bookmark, Trash2, Pencil, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { toggleLike, deletePost } from "@/lib/post-actions"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import type { PostWithAuthor } from "@/lib/types"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"

export default function PostDetail({ postId }: { postId: string }) {
  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const isMobileHook = useMobile()

  /* ---------------------------------------------------------------------- */
  /* load post & like status                                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    load()
  }, [postId])

  useEffect(() => {
    if (session?.user && post) likeStatus()
  }, [post, session])

  async function load() {
    try {
      setLoading(true)
      const res = await fetch(`/api/posts/${postId}`)
      const data = await res.json()
      console.log(data)
      if (data.success) setPost(data.data)
      else setError(data.error || "Failed to fetch post")
    } catch {
      setError("An error occurred while fetching the post")
    } finally {
      setLoading(false)
    }
  }

  async function likeStatus() {
    try {
      const res = await fetch(`/api/posts/${postId}/like`)
      
      const data = await res.json()
      
      if (data.success) setIsLiked(data.data.liked)
    } catch (err) {
      console.error("Like status error:", err)
    }
  }

  /* ---------------------------------------------------------------------- */
  /* user actions                                                           */
  /* ---------------------------------------------------------------------- */

  async function handleLike() {
    if (!session) return router.push("/login")

    try {
      const result = await toggleLike(postId)
      if (!result.success || !result.data) return

      setIsLiked(result.data.liked)
      if (post) {
        setPost({
          ...post,
          _count: {
            ...post._count,
            likes: result.data.liked
              ? post._count.likes + 1
              : post._count.likes - 1,
          },
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      })
    }
  }

  async function handleSavePost() {
    if (!session) return router.push("/login")

    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "POST", postId }),
      })
      const data = await res.json()

      toast({
        title: data.success ? "Success" : "Error",
        description: data.success ? "Post saved" : data.error,
        variant: data.success ? "default" : "destructive",
      })
    } catch {
      toast({
        title: "Error",
        description: "Save failed",
        variant: "destructive",
      })
    }
  }

  async function handleDelete() {
    if (!session || !post) return

    try {
      const result = await deletePost(postId)
      toast({
        title: result.success ? "Success" : "Error",
        description: result.success ? "Post deleted" : result.error,
        variant: result.success ? "default" : "destructive",
      })
      if (result.success) router.push("/")
    } catch {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      })
    }
  }

  /* ---------------------------------------------------------------------- */
  /* guards                                                                  */
  /* ---------------------------------------------------------------------- */

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    )

  if (error)
    return (
      <div className="py-8 px-4 text-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-500">Error: {error}</div>
      </div>
    )

  if (!post)
    return (
      <div className="py-8 px-4 text-center">
        <div className="rounded-lg bg-gray-50 p-4">Post not found</div>
      </div>
    )
  console.log(post)
  
  const isOwner = session?.user?.id === post.author.id
  const isAdmin = session?.user?.role === "ADMIN"

  /* ---------------------------------------------------------------------- */
  /* render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <Card className="rounded-none border-0 shadow-none md:rounded-lg md:border md:shadow">
      <CardContent className="p-3 sm:p-6">
        {/* header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
                <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                {post.author.name}
              </Link>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          {/* actions – mobile uses Sheet, desktop uses Dropdown */}
          <PostActions
            isMobile={isMobileHook}
            ownerOrAdmin={isOwner || isAdmin}
            onSave={handleSavePost}
            onDelete={handleDelete}
            postId={post.id}
          />
        </div>

        {/* body */}
        <div className="mt-4 space-y-3">
          {post.content && <p className="whitespace-pre-wrap">{post.content}</p>}

          {post.PostMedia && post.PostMedia.length > 0 && (
            <MediaCarousel media={post.PostMedia} />
          )}
        </div>

        {/* footer / actions */}
        <div className="mt-4 flex items-center justify-between border-t pt-2">
          <div className="flex space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`mr-1.5 h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              {post._count.likes}
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link href={`/posts/${post.id}#comments`}>
                <MessageCircle className="mr-1.5 h-5 w-5" />
                {post._count.comments}
              </Link>
            </Button>
          </div>

          <div className="hidden md:flex space-x-2">
            <Button variant="ghost" size="sm">
              <Share2 className="mr-1 h-4 w-4" />
              Сподели
            </Button>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MediaCarouselProps {
  media: { url: string; type: "IMAGE" | "VIDEO" }[]
}

function MediaCarousel({ media }: MediaCarouselProps) {
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
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              className="max-h-full max-w-full rounded-lg"
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 rounded-full h-8 w-8 sm:h-10 sm:w-10 backdrop-blur-sm"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 rounded-full h-8 w-8 sm:h-10 sm:w-10 backdrop-blur-sm"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        )}

        {/* Media counter */}
        {media.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs sm:text-sm backdrop-blur-sm">
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
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 hover:scale-110 ${
                index === currentIndex 
                  ? "bg-blue-500 scale-110" 
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={(e) => goToSlide(index, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* helper component for action menus                                          */
/* -------------------------------------------------------------------------- */

function PostActions({
  isMobile,
  ownerOrAdmin,
  onSave,
  onDelete,
  postId,
}: {
  isMobile: boolean
  ownerOrAdmin: boolean
  onSave: () => void
  onDelete: () => void
  postId: string
}) {
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="space-y-4 py-4">
            <h3 className="pb-4 text-center text-lg font-semibold">Опции за поста</h3>

            {ownerOrAdmin && (
              <>
                <Button
                  variant="ghost"
                  className="h-12 w-full justify-start text-red-500"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-3 h-5 w-5" />
                  Изтрии
                </Button>
              </>
            )}

            <Button variant="ghost" className="h-12 w-full justify-start">
              <Share2 className="mr-3 h-5 w-5" />
              Сподели
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  /* desktop dropdown */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">

        {ownerOrAdmin && (
          <>
            <DropdownMenuItem onClick={onDelete} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Изтрии
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem>Докладвай</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
