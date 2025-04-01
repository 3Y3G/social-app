import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { sanitizeUser } from "@/lib/utils"

// Validation schema
const storySchema = z.object({
  content: z.string().optional(),
  image: z.string().min(1, "Story must have an image"),
})

// Get all active stories
export async function GET(req: Request) {
  try {
    // Get stories that haven't expired yet
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Sanitize user data
    const sanitizedStories = stories.map((story) => ({
      ...story,
      author: sanitizeUser(story.author),
    }))

    return NextResponse.json({ success: true, data: sanitizedStories })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stories" }, { status: 500 })
  }
}

// Create a new story
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const result = storySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 })
    }

    const { content, image } = result.data

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

    return NextResponse.json({ success: true, data: sanitizedStory }, { status: 201 })
  } catch (error) {
    console.error("Error creating story:", error)
    return NextResponse.json({ success: false, error: "Failed to create story" }, { status: 500 })
  }
}

