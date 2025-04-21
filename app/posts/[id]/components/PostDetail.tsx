"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Share2, MoreHorizontal, Bookmark, Trash2, Pencil, MessageCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

  useEffect(() => {
    fetchPost()
  }, [postId])

  useEffect(() => {
    if (session?.user && post) {
      checkLikeStatus()
    }
  }, [post, session])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}`)
      const data = await response.json()

      if (data.success) {
        setPost(data.data)
      } else {
        setError(data.error || "Failed to fetch post")
      }
    } catch (error) {
      setError("An error occurred while fetching the post")
    } finally {
      setLoading(false)
    }
  }

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`)
      const data = await response.json()

      if (data.success) {
        setIsLiked(data.data.liked)
      }
    } catch (error) {
      console.error("Error checking like status:", error)
    }
  }

  const handleLike = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const result = await toggleLike(postId)
      if (result.success && result.data) {
        setIsLiked(result.data.liked)
        if (post) {
          setPost({
            ...post,
            _count: {
              ...post._count,
              likes: result.data.liked ? post._count.likes + 1 : post._count.likes - 1,
            },
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      })
    }
  }

  const handleSavePost = async () => {
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
          title: "Success",
          description: "Post saved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save post",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the post",
        variant: "destructive",
      })
    }
  }

  const handleDeletePost = async () => {
    if (!session || !post) return

    try {
      const result = await deletePost(postId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete post",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the post",
        variant: "destructive",
      })
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )

  if (error)
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          <p>Error: {error}</p>
        </div>
      </div>
    )

  if (!post)
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p>Post not found</p>
        </div>
      </div>
    )

  const isAuthor = session?.user?.id === post.author.id
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <Card className="md:border md:shadow md:rounded-lg border-0 shadow-none rounded-none">
      <CardContent className="p-3 sm:p-6 md:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-9 w-9 md:h-10 md:w-10">
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

          {/* Mobile and Desktop Post Actions */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl">
                <div className="py-4 space-y-4">
                  <div className="flex justify-center pb-4 border-b">
                    <h3 className="font-semibold text-lg">Post options</h3>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-base font-normal h-12"
                    onClick={handleSavePost}
                  >
                    <Bookmark className="mr-3 h-5 w-5" />
                    Save Post
                  </Button>

                  {(isAuthor || isAdmin) && (
                    <>
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" asChild>
                        <Link href={`/posts/${post.id}/edit`}>
                          <Pencil className="mr-3 h-5 w-5" />
                          Edit Post
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base font-normal h-12 text-red-500"
                        onClick={handleDeletePost}
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Delete Post
                      </Button>
                    </>
                  )}

                  <Button variant="ghost" className="w-full justify-start text-base font-normal h-12">
                    <Share2 className="mr-3 h-5 w-5" />
                    Share Post
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSavePost}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save Post
                </DropdownMenuItem>
                {(isAuthor || isAdmin) && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/posts/${post.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Post
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 md:mt-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
          {post.image && (
            <div className="mt-3 -mx-3 md:mx-0 md:mt-4">
              <img
                src={post.image || "/placeholder.svg"}
                alt="Post image"
                className="md:rounded-lg rounded-none max-h-[80vh] w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t md:mt-4 flex items-center justify-between">
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" onClick={handleLike} className={`${isLiked ? "text-red-500" : ""} px-2`}>
              <Heart className={`mr-1.5 h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm">{post._count.likes}</span>
            </Button>

            <Button variant="ghost" size="sm" className="px-2" asChild>
              <Link href={`/posts/${post.id}#comments`}>
                <MessageCircle className="mr-1.5 h-5 w-5" />
                <span className="text-sm">{post._count.comments}</span>
              </Link>
            </Button>
          </div>

          <div className="hidden md:flex md:space-x-2">
            <Button variant="ghost" size="sm" onClick={handleSavePost}>
              <Bookmark className="mr-1 h-4 w-4" />
              Save
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" className="px-2">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

