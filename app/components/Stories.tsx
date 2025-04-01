"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { StoryWithAuthor } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Plus, X, ImageIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createStory } from "@/lib/story-actions"
import { useRouter } from "next/navigation"

export default function Stories() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<StoryWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [storyContent, setStoryContent] = useState("")
  const [storyImage, setStoryImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch("/api/stories")
        const data = await response.json()
        if (data.success) {
          setStories(data.data)
        } else {
          setError(data.error || "Failed to fetch stories")
        }
      } catch (error) {
        setError("An error occurred while fetching stories")
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // In a real app, you would upload to a storage service
    // For now, we'll use a data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setStoryImage(reader.result as string)
      setIsUploading(false)
    }
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      })
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!storyImage) {
      toast({
        title: "Error",
        description: "Please select an image for your story",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      if (storyContent) formData.append("content", storyContent)
      formData.append("image", storyImage)

      const result = await createStory(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your story has been published",
        })

        // Add the new story to the list
        if (result.data && session?.user) {
          setStories([result.data, ...stories])
        }

        // Reset form and close dialog
        setStoryContent("")
        setStoryImage(null)
        setIsDialogOpen(false)

        // Refresh the page to show the new story
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to publish story",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while publishing your story",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeImage = () => {
    setStoryImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (loading)
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-24">
          <p className="text-gray-500">Loading stories...</p>
        </div>
      </Card>
    )

  if (error)
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-24">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </Card>
    )

  return (
    <Card className="p-4">
      <ScrollArea className="w-full">
        <div className="flex space-x-4 pb-4">
          {session?.user && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center space-y-1 p-0 h-auto">
                  <Avatar className="h-16 w-16 ring-2 ring-blue-500">
                    <div className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || ""} />
                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">Your Story</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Story</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="content">Caption (optional)</Label>
                    <Textarea
                      id="content"
                      placeholder="What's on your mind?"
                      value={storyContent}
                      onChange={(e) => setStoryContent(e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  {storyImage ? (
                    <div className="relative">
                      <img
                        src={storyImage || "/placeholder.svg"}
                        alt="Story preview"
                        className="w-full h-64 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6">
                      <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload an image for your story</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Select Image"}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || isUploading || !storyImage}>
                      {isSubmitting ? "Publishing..." : "Publish Story"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {!session && (
            <Link href="/login">
              <Button variant="ghost" className="flex flex-col items-center space-y-1 p-0 h-auto">
                <Avatar className="h-16 w-16 ring-2 ring-blue-500">
                  <div className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <AvatarFallback>+</AvatarFallback>
                </Avatar>
                <span className="text-xs">Add Story</span>
              </Button>
            </Link>
          )}

          {stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`}>
              <Button variant="ghost" className="flex flex-col items-center space-y-1 p-0 h-auto">
                <Avatar className="h-16 w-16 ring-2 ring-blue-500">
                  <AvatarImage src={story.author.image || undefined} alt={story.author.name || ""} />
                  <AvatarFallback>{story.author.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-[64px]">{story.author.name}</span>
              </Button>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  )
}

