"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { addComment, deleteComment } from "@/lib/comment-actions"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import type { CommentWithAuthor } from "@/lib/types"

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.data)
      } else {
        setError(data.error || "Failed to fetch comments")
      }
    } catch (error) {
      setError("An error occurred while fetching comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/login")
      return
    }

    if (!newComment.trim()) return

    setSubmitting(true)
    const formData = new FormData()
    formData.append("content", newComment)
    formData.append("postId", postId)

    try {
      const result = await addComment(formData)
      if (result.success) {
        setNewComment("")
        setComments([result.data, ...comments])
        toast({
          title: "Success",
          description: "Comment added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const result = await deleteComment(commentId)
      if (result.success) {
        setComments(comments.filter((comment) => comment.id !== commentId))
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting comment",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {session ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarImage src={session.user.image || undefined} alt={session.user.name || ""} />
                <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  {submitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 text-center">
            <p className="mb-2">Please log in to comment</p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        )}

        {loading && comments.length === 0 ? (
          <div className="text-center py-4">Loading comments...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">Error: {error}</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4">No comments yet. Be the first to comment!</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isAuthor = session?.user?.id === comment.author.id
              const isAdmin = session?.user?.role === "ADMIN"
              const isPostAuthor = session?.user?.id === comment.postId

              return (
                <div key={comment.id} className="flex space-x-4">
                  <Link href={`/profile/${comment.author.id}`}>
                    <Avatar>
                      <AvatarImage src={comment.author.image || undefined} alt={comment.author.name || ""} />
                      <AvatarFallback>{comment.author.name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/profile/${comment.author.id}`} className="font-semibold hover:underline">
                          {comment.author.name}
                        </Link>
                        <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                      </div>
                      {(isAuthor || isAdmin || isPostAuthor) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Comment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

