import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"

// Get a specific story
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const story = await prisma.story.findUnique({
      where: {
        id: params.id,
      },
      include: {
        author: true,
      },
    })

    if (!story) {
      return NextResponse.json({ success: false, error: "Story not found" }, { status: 404 })
    }

    // Check if story has expired
    if (new Date(story.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "Story has expired" }, { status: 410 })
    }

    // Sanitize user data
    const sanitizedStory = {
      ...story,
      author: sanitizeUser(story.author),
    }

    return NextResponse.json({ success: true, data: sanitizedStory })
  } catch (error) {
    console.error("Error fetching story:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch story" }, { status: 500 })
  }
}

// Delete a story
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!story) {
      return NextResponse.json({ success: false, error: "Story not found" }, { status: 404 })
    }

    // Check if user is author or admin
    if (story.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized to delete this story" }, { status: 403 })
    }

    // Delete story
    await prisma.story.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting story:", error)
    return NextResponse.json({ success: false, error: "Failed to delete story" }, { status: 500 })
  }
}

