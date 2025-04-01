"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"
import { z } from "zod"

// Validation schema
const storySchema = z.object({
  content: z.string().optional(),
  image: z.string().min(1, "Story must have an image"),
})

// Create a new story
export async function createStory(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const content = (formData.get("content") as string) || undefined
    const image = formData.get("image") as string

    // Validate input
    const result = storySchema.safeParse({ content, image })
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    // Set expiration time (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.story.create({
      data: {
        content,
        image,
        expiresAt,
        authorId: session.user.id,
      },
      include: {
        author: true,
      },
    })

    // Sanitize user data
    const sanitizedStory = {
      ...story,
      author: sanitizeUser(story.author),
    }

    revalidatePath("/")

    return { success: true, data: sanitizedStory }
  } catch (error) {
    console.error("Error creating story:", error)
    return { success: false, error: "Failed to create story" }
  }
}

// Delete a story
export async function deleteStory(id: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: {
        id,
      },
    })

    if (!story) {
      return { success: false, error: "Story not found" }
    }

    // Check if user is author or admin
    if (story.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized to delete this story" }
    }

    // Delete story
    await prisma.story.delete({
      where: {
        id,
      },
    })

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting story:", error)
    return { success: false, error: "Failed to delete story" }
  }
}

