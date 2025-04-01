import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { sanitizeUser } from "@/lib/utils"

// Validation schema
const savedItemSchema = z.object({
  type: z.enum(["POST", "LINK", "IMAGE"]),
  postId: z.string().optional(),
  url: z.string().optional(),
})

// Get all saved items
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    const whereClause: any = {
      userId: session.user.id,
    }

    if (type) {
      whereClause.type = type
    }

    const savedItems = await prisma.savedItem.findMany({
      where: whereClause,
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Sanitize user data
    const sanitizedItems = savedItems.map((item) => ({
      ...item,
      post: item.post
        ? {
            ...item.post,
            author: sanitizeUser(item.post.author),
          }
        : null,
    }))

    return NextResponse.json({ success: true, data: sanitizedItems })
  } catch (error) {
    console.error("Error fetching saved items:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch saved items" }, { status: 500 })
  }
}

// Save an item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const result = savedItemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 })
    }

    const { type, postId } = result.data

    // If saving a post, check if it exists
    if (type === "POST" && postId) {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      })

      if (!post) {
        return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
      }

      // Check if already saved
      const existingSave = await prisma.savedItem.findFirst({
        where: {
          userId: session.user.id,
          postId,
        },
      })

      if (existingSave) {
        return NextResponse.json({ success: false, error: "Item already saved" }, { status: 400 })
      }
    }

    // Create saved item
    const savedItem = await prisma.savedItem.create({
      data: {
        type,
        postId,
        userId: session.user.id,
      },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
    })

    // Sanitize user data
    const sanitizedItem = {
      ...savedItem,
      post: savedItem.post
        ? {
            ...savedItem.post,
            author: sanitizeUser(savedItem.post.author),
          }
        : null,
    }

    return NextResponse.json({ success: true, data: sanitizedItem }, { status: 201 })
  } catch (error) {
    console.error("Error saving item:", error)
    return NextResponse.json({ success: false, error: "Failed to save item" }, { status: 500 })
  }
}

