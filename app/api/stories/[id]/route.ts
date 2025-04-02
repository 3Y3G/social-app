import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const storyId = params.id

    // Check if the story exists
    const story = await prisma.story.findUnique({
      where: {
        id: storyId,
      },
    })

    if (!story) {
      return NextResponse.json({ success: false, error: "Story not found" }, { status: 404 })
    }

    // Check if the user is the author or an admin
    if (story.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Delete the story
    await prisma.story.delete({
      where: {
        id: storyId,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: "Story deleted successfully" },
    })
  } catch (error) {
    console.error("Error deleting story:", error)
    return NextResponse.json({ success: false, error: "Failed to delete story" }, { status: 500 })
  }
}

