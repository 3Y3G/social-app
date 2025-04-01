"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function createPost(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const content = formData.get("content") as string
    const image = formData.get("image") as string

    if (!content && !image) {
      return { success: false, error: "Post must have content or image" }
    }

    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: session.user.id,
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

