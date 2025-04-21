"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updatePost } from "../actions"
import { X, Loader2 } from "lucide-react"

type Post = {
    id: string
    content: string
    image: string | null
    authorId: string
    author: {
        id: string
        name: string | null
        image: string | null
    }
    createdAt: Date
}

export default function EditPostForm({ post }: { post: Post }) {
    const [content, setContent] = useState(post.content || "")
    const [image, setImage] = useState<string | null>(post.image)
    const [newImage, setNewImage] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(post.image)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { toast } = useToast()

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Create a preview URL
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)

        setNewImage(file)
    }

    const removeImage = () => {
        setImage(null)
        setPreviewUrl(null)
        setNewImage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim() && !image && !newImage) {
            toast({
                title: "Error",
                description: "Post must have content or an image",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const formData = new FormData()
            formData.append("postId", post.id)
            formData.append("content", content)

            // If we have a new image, add it to the form data
            if (newImage) {
                formData.append("image", newImage)
            } else if (image === null) {
                // If image was removed
                formData.append("removeImage", "true")
            }

            const result = await updatePost(formData)

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Post updated successfully",
                })
                router.push(`/posts/${post.id}`)
                router.refresh()
            } else {
                throw new Error(result.error || "Failed to update post")
            }
        } catch (error) {
            console.error("Error updating post:", error)
            toast({
                title: "Error",
                description: "Failed to update post. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Textarea
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[150px] resize-none"
                        />
                    </div>

                    {previewUrl && (
                        <div className="relative mt-4">
                            <img
                                src={previewUrl || "/placeholder.svg"}
                                alt="Post image preview"
                                className="max-h-[300px] rounded-lg object-cover"
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

                    <div className="flex items-center space-x-2">
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            {previewUrl ? "Change Image" : "Add Image"}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || (!content.trim() && !previewUrl)}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Post"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
