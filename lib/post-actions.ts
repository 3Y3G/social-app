"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import type { UIDraft } from "./types"

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

export async function createPost(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const content = formData.get("content") as string
    const postType = (formData.get("postType") as string) || "post"
    const metadataStr = formData.get("metadata") as string | null
    const draftId = formData.get("draftId") as string | null

    // Parse metadata if provided
    let metadata: any = {}
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr)
      } catch (e) {
        console.error("Error parsing metadata:", e)
      }
    }

    // Extract tags, location, and mentions from metadata
    const { tags, location, mentions } = metadata as {
      tags?: string[]
      location?: string
      mentions?: string[]
    }

    // Process media files
    const mediaFiles: {
      url: string
      type: string
      filters?: string[]
      edits?: any
    }[] = []

    // In a real app, you would upload files to a storage service
    // For now, we'll use placeholder URLs
    let i = 0
    while (formData.get(`media_${i}`)) {
      const mediaFile = formData.get(`media_${i}`) as File
      const mediaType = formData.get(`mediaType_${i}`) as string
      const filtersStr = formData.get(`filters_${i}`) as string | null
      const editsStr = formData.get(`edits_${i}`) as string | null

      let filters: string[] | undefined
      let edits: any | undefined

      if (filtersStr) {
        try {
          filters = JSON.parse(filtersStr)
        } catch (e) {
          console.error("Error parsing filters:", e)
        }
      }

      if (editsStr) {
        try {
          edits = JSON.parse(editsStr)
        } catch (e) {
          console.error("Error parsing edits:", e)
        }
      }

      // Generate a placeholder URL based on media type
      const url =
        mediaType === "image"
          ? `/placeholder.svg?height=600&width=600&text=Image_${i}`
          : `/placeholder.svg?height=600&width=600&text=Video_${i}`

      mediaFiles.push({
        url,
        type: mediaType,
        filters,
        edits,
      })

      i++
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        content,
        authorId: session.user.id,
        // Store tags and location in the database
        tags: tags ? tags.join(",") : undefined,
        location,
        postType,
        // Store media files as JSON
        media: mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : undefined,
        // Store mentions
        mentions: mentions ? mentions.join(",") : undefined,
      },
      include: {
        author: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    // If this was a draft, delete it
    if (draftId) {
      await prisma.draft
        .delete({
          where: { id: draftId },
        })
        .catch((e) => console.error("Error deleting draft:", e))
    }

    revalidatePath("/")
    return { success: true, data: post }
  } catch (error) {
    console.error("Error creating post:", error)
    return { success: false, error: "Failed to create post" }
  }
}

export async function toggleLike(postId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the user has already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    })

    let liked = false

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      })
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: session.user.id,
          postId,
        },
      })
      liked = true

      // Create notification if the user is not the post author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      })

      if (post && post.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            content: "liked your post",
            senderId: session.user.id,
            recipientId: post.authorId,
            postId,
          },
        })
      }
    }

    revalidatePath(`/posts/${postId}`)
    return { success: true, data: { liked } }
  } catch (error) {
    console.error("Error toggling like:", error)
    return { success: false, error: "Failed to toggle like" }
  }
}

export async function deletePost(postId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the user is the post author or an admin
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (!post) {
      return { success: false, error: "Post not found" }
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized to delete this post" }
    }

    // Delete the post and all related data (likes, comments, etc.)
    await prisma.post.delete({
      where: { id: postId },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting post:", error)
    return { success: false, error: "Failed to delete post" }
  }
}

export async function sharePost(postId: string, platform: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // In a real app, you would implement sharing to different platforms
    // For now, we'll just record the share action
    await prisma.share.create({
      data: {
        userId: session.user.id,
        postId,
        platform,
      },
    })

    // Create notification for post author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (post && post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "SHARE",
          content: `shared your post on ${platform}`,
          senderId: session.user.id,
          recipientId: post.authorId,
          postId,
        },
      })
    }

    revalidatePath(`/posts/${postId}`)
    return { success: true }
  } catch (error) {
    console.error("Error sharing post:", error)
    return { success: false, error: "Failed to share post" }
  }
}

export async function saveDraft(data: {
  caption: string
  tags: string[]
  location: string
  mentions: string[]
  mediaItems: MediaItem[]
  draftId?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const { caption, tags, location, mentions, mediaItems, draftId } = data

    // Process media items
    const processedMediaItems = mediaItems.map((item) => ({
      type: item.type,
      preview: item.preview,
      filters: item.filters,
      edits: item.edits,
      // In a real app, you would upload the file to a storage service
      // For now, we'll just store the file name
      fileName: item.file.name,
      fileType: item.file.type,
      fileSize: item.file.size,
    }))

    if (draftId) {
      // Update existing draft
      await prisma.draft.update({
        where: { id: draftId },
        data: {
          caption,
          tags: tags.join(","),
          location,
          mentions: mentions.join(","),
          media: JSON.stringify(processedMediaItems),
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new draft
      await prisma.draft.create({
        data: {
          id: uuidv4(),
          userId: session.user.id,
          caption,
          tags: tags.join(","),
          location,
          mentions: mentions.join(","),
          media: JSON.stringify(processedMediaItems),
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error saving draft:", error)
    return { success: false, error: "Failed to save draft" }
  }
}

export async function deleteDraft(draftId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the draft exists and belongs to the user
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { userId: true },
    })

    if (!draft) {
      return { success: false, error: "Draft not found" }
    }

    if (draft.userId !== session.user.id) {
      return { success: false, error: "Not authorized to delete this draft" }
    }

    // Delete the draft
    await prisma.draft.delete({
      where: { id: draftId },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting draft:", error)
    return { success: false, error: "Failed to delete draft" }
  }
}

export async function getDrafts(): Promise<{ success: true; data: UIDraft[] } | { success: false; error: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get all drafts for the user
    const drafts = await prisma.draft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    // Process drafts to match the expected format
    const processedDrafts = drafts.map((draft) => {
      let mediaItems: MediaItem[] = []

      try {
        const parsedMedia = JSON.parse(draft.media || "[]")
        mediaItems = parsedMedia.map((item: any) => ({
          file: new File([], item.fileName, { type: item.fileType }),
          type: item.type,
          preview: item.preview,
          filters: item.filters,
          edits: item.edits,
        }))
      } catch (e) {
        console.error("Error parsing media:", e)
      }

      return {
        id: draft.id,
        caption: draft.caption,
        tags: draft.tags ? draft.tags.split(",") : [],
        location: draft.location || "",
        mentions: draft.mentions ? draft.mentions.split(",") : [],
        mediaItems,
        createdAt: draft.createdAt.toISOString(),
      }
    })

    return { success: true, data: processedDrafts }
  } catch (error) {
    console.error("Error fetching drafts:", error)
    return { success: false, error: "Failed to fetch drafts" }
  }
}
