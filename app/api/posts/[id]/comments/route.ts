import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const postId = params.id

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            occupation: true,
            location: true,
            bio: true,
            coverImage: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id
    const formData = await request.formData()
    const content = formData.get("content") as string

    if (!content) {
      return NextResponse.json({ success: false, error: "Comment cannot be empty" }, { status: 400 })
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    })

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        postId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            occupation: true,
            location: true,
            bio: true,
            coverImage: true,
          },
        },
      },
    })

    // Create notification for the post author if it's not the same user
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "COMMENT",
          content: "commented on your post",
          senderId: session.user.id,
          recipientId: post.authorId,
          postId,
        },
      })
    }

    return NextResponse.json({ success: true, data: comment })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 })
  }
}

