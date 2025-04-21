"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function addComment(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const content = formData.get("content") as string
    const postId = formData.get("postId") as string

    if (!content) {
      return { success: false, error: "Comment cannot be empty" }
    }

    if (!postId) {
      return { success: false, error: "Post ID is required" }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        postId,
      },
      include: {
        author: true,
      },
    })

    // Create notification for the post author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (post && post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          content: "коментира публикацията ви",
          senderId: session.user.id,
          recipientId: post.authorId,
          postId,
        },
      })
    }

    revalidatePath(`/posts/${postId}`)
    return { success: true, data: comment }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the user is the comment author, post author, or an admin
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            authorId: true,
          },
        },
      },
    })

    if (!comment) {
      return { success: false, error: "Comment not found" }
    }

    const isCommentAuthor = comment.authorId === session.user.id
    const isPostAuthor = comment.post.authorId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return { success: false, error: "Not authorized to delete this comment" }
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    })

    revalidatePath(`/posts/${comment.postId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return { success: false, error: "Failed to delete comment" }
  }
}

