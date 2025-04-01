"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlusIcon, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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

export default function Stories() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [storyImage, setStoryImage] = useState<File | null>(null)
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/stories")
      const data = await response.json()

      if (data.success) {
        setStories(data.data)
      }
    } catch (error) {
      console.error("Error fetching stories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStoryImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setStoryImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateStory = async () => {
    if (!session) {
      router.push("/login")
      return
    }

    if (!storyImage) {
      toast({
        title: "Error",
        description: "Please select an image for your story",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Create form data for the image upload
      const formData = new FormData()
      formData.append("image", storyImage)
      formData.append("caption", caption)

      const response = await fetch("/api/stories", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Story created successfully",
        })

        // Reset form
        setStoryImage(null)
        setStoryImagePreview(null)
        setCaption("")

        // Refresh stories
        fetchStories()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create story",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating your story",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStoryClick = (storyId: string) => {
    router.push(`/stories/${storyId}`)
  }

  return (
    <div className="mb-4 overflow-hidden">
      <div className="flex overflow-x-auto gap-4 py-2 px-1 no-scrollbar">
        {/* Create Story Button */}
        <div className="flex flex-col items-center min-w-[72px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full border-2 border-dashed flex-shrink-0"
              >
                <PlusIcon className="h-6 w-6" />
                <span className="sr-only">Create story</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {storyImagePreview ? (
                  <div className="relative aspect-[9/16] max-h-[50vh] overflow-hidden rounded-md">
                    <img
                      src={storyImagePreview || "/placeholder.svg"}
                      alt="Story preview"
                      className="object-cover w-full h-full"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        setStoryImage(null)
                        setStoryImagePreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-8">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Select Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <p className="text-sm text-gray-500 mt-2">JPG, PNG, GIF up to 10MB</p>
                  </div>
                )}

                <Textarea
                  placeholder="Add a caption to your story..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="resize-none"
                />

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateStory} disabled={!storyImage || isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Story"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-xs mt-1">Your story</span>
        </div>

        {/* Stories List */}
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center min-w-[72px]">
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-3 w-12 mt-1 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))
        ) : stories.length > 0 ? (
          stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-col items-center min-w-[72px] cursor-pointer"
              onClick={() => handleStoryClick(story.id)}
            >
              <Avatar className="h-16 w-16 ring-2 ring-neutral-900 dark:ring-neutral-50">
                <AvatarImage src={story.author.image || undefined} />
                <AvatarFallback>{story.author.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1 truncate w-full text-center">{story.author.name}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full py-4">
            <p className="text-sm text-gray-500">No stories yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

