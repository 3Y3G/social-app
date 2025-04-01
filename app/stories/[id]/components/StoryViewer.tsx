"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { X, MoreHorizontal, MessageCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteStory } from "@/lib/story-actions"
import { useToast } from "@/hooks/use-toast"

type StoryViewerProps = {
  story: {
    id: string
    content: string | null
    image: string
    createdAt: Date
    expiresAt: Date
    authorId: string
    author: {
      id: string
      name: string | null
      image: string | null
      [key: string]: any
    }
  }
  currentUser?: {
    id: string
    role?: string
    [key: string]: any
  } | null
}

export default function StoryViewer({ story, currentUser }: StoryViewerProps) {
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  // Calculate how much time has passed since the story was created
  const totalDuration = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  const createdAt = new Date(story.createdAt).getTime()
  const expiresAt = new Date(story.expiresAt).getTime()
  const now = Date.now()
  const elapsed = now - createdAt
  const remaining = expiresAt - now

  // Calculate initial progress (0-100)
  const initialProgress = Math.min(100, (elapsed / totalDuration) * 100)

  useEffect(() => {
    // Set initial progress
    setProgress(initialProgress)

    // Auto-close after the story expires
    const timeout = setTimeout(() => {
      router.push("/")
    }, remaining)

    return () => clearTimeout(timeout)
  }, [initialProgress, remaining, router])

  const handleClose = () => {
    router.push("/")
  }

  const handleDelete = async () => {
    try {
      const result = await deleteStory(story.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Story deleted successfully",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete story",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the story",
        variant: "destructive",
      })
    }
  }

  const isAuthor = currentUser?.id === story.authorId
  const isAdmin = currentUser?.role === "ADMIN"
  const canDelete = isAuthor || isAdmin

  return (
    <div className="relative w-full max-w-md">
      <Card className="overflow-hidden bg-black text-white">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={story.author.image || undefined} alt={story.author.name || ""} />
              <AvatarFallback>{story.author.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{story.author.name}</p>
              <p className="text-xs opacity-70">
                {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                    Delete Story
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Story content */}
        <div className="relative">
          <img
            src={story.image || "/placeholder.svg"}
            alt="Story"
            className="w-full object-cover"
            style={{ height: "calc(100vh - 100px)", maxHeight: "80vh" }}
          />

          {/* Caption overlay */}
          {story.content && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white">{story.content}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentUser && (
          <div className="p-4 flex items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Reply to story..."
                className="w-full bg-gray-800 text-white rounded-full py-2 px-4 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-white"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

