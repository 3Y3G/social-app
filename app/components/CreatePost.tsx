"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Image, Video, Smile, MapPin, X } from "lucide-react"
import { createPost } from "@/lib/post-actions"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

export default function CreatePost() {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !image) return

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("content", content)
    if (image) formData.append("image", image)

    try {
      const result = await createPost(formData)
      if (result.success) {
        setContent("")
        setImage(null)
        router.refresh()
        toast({
          title: "Success",
          description: "Your post has been created",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create post",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating your post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In a real app, you would upload the file to a storage service
    // For now, we'll use a data URL as a placeholder
    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error reading file:", error)
      setIsUploading(false)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    }
  }

  const removeImage = () => {
    setImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (!session) return null

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-4">
          <div className="flex space-x-4">
            <Avatar>
              <AvatarImage src={session.user.image || undefined} alt={session.user.name || ""} />
              <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="What's on your mind?"
              className="flex-1"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          {image && (
            <div className="mt-4 relative">
              <img
                src={image || "/placeholder.svg"}
                alt="Upload preview"
                className="max-h-60 rounded-lg object-cover"
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
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleImageClick} disabled={isUploading}>
              <Image className="mr-2 h-4 w-4" />
              Photo
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled>
              <Video className="mr-2 h-4 w-4" />
              Video
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled>
              <Smile className="mr-2 h-4 w-4" />
              Feeling
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled>
              <MapPin className="mr-2 h-4 w-4" />
              Check in
            </Button>
          </div>
          <Button type="submit" disabled={isSubmitting || isUploading || (!content.trim() && !image)}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

