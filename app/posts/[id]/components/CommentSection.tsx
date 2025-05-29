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
        setError(data.error || "Неуспешно зареждане на коментарите")
      }
    } catch (error) {
      setError("Възникна грешка при зареждането на коментарите")
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
      if (result.success && result.data) {
        setNewComment("")
        setComments([result.data, ...comments])
        toast({
          title: "Успешно",
          description: "Коментарът беше добавен успешно",
        })
      } else {
        toast({
          title: "Грешка",
          description: result.error || "Неуспешно добавяне на коментара",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при добавянето на коментара",
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
          title: "Успешно",
          description: "Коментарът беше изтрит успешно",
        })
      } else {
        toast({
          title: "Грешка",
          description: result.error || "Неуспешно изтриване на коментара",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Възникна грешка при изтриването на коментара",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Коментари ({comments.length})</CardTitle>
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
                  placeholder="Напишете коментар..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  {submitting ? "Публикуване..." : "Публикувай коментар"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 text-center">
            <p className="mb-2">Моля, влезте в профила си, за да коментирате</p>
            <Button asChild>
              <Link href="/login">Вход</Link>
            </Button>
          </div>
        )}

        {loading && comments.length === 0 ? (
          <div className="text-center py-4">Зареждане на коментари...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">Грешка: {error}</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4">Все още няма коментари. Бъдете първи!</div>
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
                              Изтрий коментара
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
