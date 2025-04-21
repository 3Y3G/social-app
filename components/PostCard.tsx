// Файл: PostCard.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toggleLike } from "@/lib/post-actions"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { PostWithAuthor } from "@/lib/types"

export default function PostCard({ post }: { post: PostWithAuthor }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const handleLike = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    try {
      const result = await toggleLike(post.id)
      if (result.success) {
        setIsLiked(result.data.liked)
        setLikeCount((prev) => (result.data.liked ? prev + 1 : prev - 1))
      }
    } catch (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно харесване на публикацията",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full overflow-hidden md:border md:shadow md:rounded-lg border-0 shadow-none rounded-none">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/profile/${post.author.id}`} className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
              <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{post.author.name}</p>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div>
          <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
          {post.image && (
            <div className="-mx-3 md:mx-0 md:rounded-lg overflow-hidden">
              <img
                src={post.image || "/placeholder.svg"}
                alt="Изображение към публикацията"
                className="w-full object-cover max-h-[500px] md:rounded-lg"
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-3 sm:px-6 py-2 border-t flex justify-between">
        <div className="flex space-x-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className={isLiked ? "text-red-500" : ""}>
            <Heart className={`mr-1 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            {likeCount}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/posts/${post.id}`}>
              <MessageCircle className="mr-1 h-4 w-4" />
              {post._count.comments}
            </Link>
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <Share2 className="mr-1 h-4 w-4" />
          Сподели
        </Button>
      </CardFooter>
    </Card>
  )
}
