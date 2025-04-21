"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type Story = {
  id: string
  image: string
  caption: string | null
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
}

export default function StoryViewer({
  story,
  currentUserId,
}: {
  story: Story
  currentUserId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [progress, setProgress] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = story.author.id === currentUserId

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 1
      })
    }, 50) // 5 seconds total duration

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress === 100) {
      // Wait a moment before navigating back
      const timeout = setTimeout(() => {
        router.push("/")
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [progress, router])

  const handleClose = () => {
    router.push("/")
  }

  const handleDeleteStory = async () => {
    if (!isOwner) return

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/stories/${story.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Story deleted successfully",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete story",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the story",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
        <div className="h-full bg-white" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 border border-neutral-200 border-white dark:border-neutral-800 dark:border-neutral-800">
            <AvatarImage src={story.author.image || undefined} />
            <AvatarFallback>{story.author.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{story.author.name}</p>
            <p className="text-xs opacity-70">{formatDate(story.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleDeleteStory}
              disabled={isDeleting}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img src={story.image || "/placeholder.svg"} alt="Story" className="max-h-full max-w-full object-contain" />
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="p-4 text-white">
          <p>{story.caption}</p>
        </div>
      )}
    </div>
  )
}
