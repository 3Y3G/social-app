import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { sanitizeUser } from "@/lib/utils"

// Validation schema for saving only posts
const savedPostSchema = z.object({
  postId: z.string(),
  url: z.string().optional(), // optional external URL reference
})

// Save a post
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result = savedPostSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 })
    }

    const { postId, url } = result.data

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    })

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    const alreadySaved = await prisma.savedItem.findFirst({
      where: {
        userId: session.user.id,
        postId,
      },
    })

    if (alreadySaved) {
      return NextResponse.json({ success: false, error: "Post already saved" }, { status: 400 })
    }

    const savedItem = await prisma.savedItem.create({
      data: {
        userId: session.user.id,
        postId,
        url: url ?? null,
      },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
    })

    const sanitized = {
      ...savedItem,
      post: {
        ...savedItem.post,
        author: sanitizeUser(savedItem.post.author),
      },
    }

    return NextResponse.json({ success: true, data: sanitized }, { status: 201 })
  } catch (error) {
    console.error("Error saving post:", error)
    return NextResponse.json({ success: false, error: "Failed to save post" }, { status: 500 })
  }
}
