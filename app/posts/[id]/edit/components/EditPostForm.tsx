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
import { Post } from "@prisma/client"


export default function EditPostForm({ post }: { post: Post }) {
    const [content, setContent] = useState(post.content || "")
    const [newImage, setNewImage] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { toast } = useToast()




    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setIsSubmitting(true)

        try {
            const formData = new FormData()
            formData.append("postId", post.id)
            formData.append("content", content)


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

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !content.trim()}>
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
