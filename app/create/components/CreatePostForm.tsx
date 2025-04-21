"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createPost, saveDraft, deleteDraft } from "@/lib/post-actions"
import { Image, Loader2, AlertCircle, Film, Save, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TagInput from "./TagInput"
import LocationSearch from "./LocationSearch"
import MediaUploader from "./MediaUploader"
import MediaEditor from "./MediaEditor"
import MentionInput from "./MentionInput"
import MediaCarousel from "./MediaCarousel"
import DraftSelector from "./DraftSelector"
import ReelsCreator from "./ReelsCreator"
import ShareOptions from "./ShareOptions"

// Define types for our media items
type MediaItem = {
  file: File
  type: "image" | "video"
  preview: string
  filters?: string[]
  edits?: {
    brightness?: number
    contrast?: number
    saturation?: number
    crop?: { x: number; y: number; width: number; height: number }
  }
}

// Define type for drafts
type Draft = {
  id: string
  caption: string
  tags: string[]
  location: string
  mentions: string[]
  mediaItems: MediaItem[]
  createdAt: string
}

interface CreatePostFormProps {
  drafts: Draft[]
}

export default function CreatePostForm({ drafts }: CreatePostFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // State for post content
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [location, setLocation] = useState("")
  const [mentions, setMentions] = useState<string[]>([])

  // UI state
  const [activeTab, setActiveTab] = useState("upload")
  const [postType, setPostType] = useState<"post" | "reel">("post")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    media?: string
    caption?: string
  }>({})

  // State for editing
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)

  // Clear errors when inputs change
  useEffect(() => {
    if (mediaItems.length > 0) {
      setErrors((prev) => ({ ...prev, media: undefined }))
    }
    if (caption) {
      setErrors((prev) => ({ ...prev, caption: undefined }))
    }
  }, [mediaItems, caption])

  // Load draft if selected
  useEffect(() => {
    if (selectedDraft) {
      setCaption(selectedDraft.caption)
      setTags(selectedDraft.tags)
      setLocation(selectedDraft.location)
      setMentions(selectedDraft.mentions)
      setMediaItems(selectedDraft.mediaItems)
    }
  }, [selectedDraft])

  const handleMediaAdd = (newMedia: MediaItem[]) => {
    setMediaItems((prev) => [...prev, ...newMedia])
  }

  const handleMediaRemove = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMediaEdit = (index: number) => {
    setCurrentEditIndex(index)
    setActiveTab("edit")
  }

  const handleMediaUpdate = (updatedMedia: MediaItem) => {
    if (currentEditIndex !== null) {
      setMediaItems((prev) => prev.map((item, i) => (i === currentEditIndex ? updatedMedia : item)))
      setCurrentEditIndex(null)
      setActiveTab("upload")
    }
  }

  const handleMediaReorder = (newOrder: MediaItem[]) => {
    setMediaItems(newOrder)
  }

  const handleSaveDraft = async () => {
    if (mediaItems.length === 0 && !caption.trim()) {
      toast({
        title: "Error",
        description: "Cannot save an empty draft",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await saveDraft({
        caption,
        tags,
        location,
        mentions,
        mediaItems,
        draftId: selectedDraft?.id,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Draft saved successfully",
        })

        if (!selectedDraft) {
          // Clear form if creating a new draft
          setMediaItems([])
          setCaption("")
          setTags([])
          setLocation("")
          setMentions([])
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save draft",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving draft",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDraft = async () => {
    if (!selectedDraft) return

    try {
      const result = await deleteDraft(selectedDraft.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Draft deleted successfully",
        })
        setSelectedDraft(null)
        setMediaItems([])
        setCaption("")
        setTags([])
        setLocation("")
        setMentions([])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete draft",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting draft",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: { media?: string; caption?: string } = {}

    if (mediaItems.length === 0 && !caption.trim()) {
      newErrors.media = "Please upload media or write a caption"
      newErrors.caption = "Please upload media or write a caption"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("content", caption)
      formData.append("postType", postType)

      // Add media files
      mediaItems.forEach((item, index) => {
        formData.append(`media_${index}`, item.file)
        formData.append(`mediaType_${index}`, item.type)

        if (item.filters && item.filters.length > 0) {
          formData.append(`filters_${index}`, JSON.stringify(item.filters))
        }

        if (item.edits) {
          formData.append(`edits_${index}`, JSON.stringify(item.edits))
        }
      })

      // Add metadata
      const metadata = {
        tags: tags.length > 0 ? tags : undefined,
        location: location || undefined,
        mentions: mentions.length > 0 ? mentions : undefined,
      }

      formData.append("metadata", JSON.stringify(metadata))

      // If this was a draft, include the draft ID to delete it after posting
      if (selectedDraft) {
        formData.append("draftId", selectedDraft.id)
      }

      const result = await createPost(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your post has been created",
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "An error occurred while creating your post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <Button
              variant={postType === "post" ? "default" : "outline"}
              onClick={() => setPostType("post")}
              className="flex items-center"
            >
              <Image className="mr-2 h-4 w-4" />
              Post
            </Button>
            <Button
              variant={postType === "reel" ? "default" : "outline"}
              onClick={() => setPostType("reel")}
              className="flex items-center"
            >
              <Film className="mr-2 h-4 w-4" />
              Reel
            </Button>
          </div>

          <div className="flex space-x-2">
            <DraftSelector drafts={drafts} onSelect={setSelectedDraft} selectedDraft={selectedDraft} />

            <Button variant="outline" onClick={handleSaveDraft} className="flex items-center">
              <Save className="mr-2 h-4 w-4" />
              Запазване на черновата
            </Button>

            {selectedDraft && (
              <Button variant="outline" onClick={handleDeleteDraft} className="flex items-center text-red-500">
                <Trash className="mr-2 h-4 w-4" />
                Изтриване на чернова
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="edit" disabled={currentEditIndex === null && mediaItems.length === 0}>
              Редактиране
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={mediaItems.length === 0}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Медия</Label>

                {postType === "post" ? (
                  <MediaUploader
                    mediaItems={mediaItems}
                    onAdd={handleMediaAdd}
                    onRemove={handleMediaRemove}
                    onEdit={handleMediaEdit}
                    onReorder={handleMediaReorder}
                    maxItems={10}
                    acceptedTypes={{
                      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
                      "video/*": [".mp4", ".mov", ".avi", ".webm"],
                    }}
                  />
                ) : (
                  <ReelsCreator
                    mediaItems={mediaItems}
                    onAdd={handleMediaAdd}
                    onRemove={handleMediaRemove}
                    onEdit={handleMediaEdit}
                  />
                )}

                {errors.media && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.media}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Caption with Mentions */}
              <div className="space-y-2">
                <Label htmlFor="caption">Надпис</Label>
                <MentionInput
                  value={caption}
                  onChange={setCaption}
                  onMentionsChange={setMentions}
                  placeholder="Write a caption... Use @ to mention users"
                  className="resize-none min-h-24"
                />
                {errors.caption && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.caption}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Етикети</Label>
                <TagInput tags={tags} setTags={setTags} />
                <p className="text-xs text-gray-500">Добавете хаштагове, за да помогнете на хората да открият публикацията ви</p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <LocationSearch value={location} onChange={setLocation} />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || (mediaItems.length === 0 && !caption.trim())}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Създава се...
                    </>
                  ) : (
                    "Create Post"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="edit">
            <MediaEditor
              media={currentEditIndex !== null ? mediaItems[currentEditIndex] : mediaItems[0]}
              onSave={handleMediaUpdate}
              onCancel={() => {
                setCurrentEditIndex(null)
                setActiveTab("upload")
              }}
            />
          </TabsContent>

          <TabsContent value="preview">
            {mediaItems.length > 0 && (
              <div className="space-y-6">
                <MediaCarousel
                  mediaItems={mediaItems}
                  caption={caption}
                  tags={tags}
                  location={location}
                  mentions={mentions}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("upload")}>
                    Назад към Редактиране
                  </Button>

                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Създава се...
                      </>
                    ) : (
                      "Create Post"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="share">
            <ShareOptions onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

