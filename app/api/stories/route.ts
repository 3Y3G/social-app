import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    // Fetch only stories that have not expired
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: stories,
    })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const image = formData.get("image") as File | null
    // Use "content" field to match the Prisma schema instead of "caption"
    const content = formData.get("caption") as string | null

    if (!image) {
      return NextResponse.json({ success: false, error: "Image is required" }, { status: 400 })
    }

    // TODO: Replace with actual upload logic (e.g., S3, Cloudinary, etc.)
    const imageUrl = "/placeholder.svg?height=800&width=450"

    // Set expiresAt to 24 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.story.create({
      data: {
        image: imageUrl,
        content: content || null,
        authorId: session.user.id,
        expiresAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: story,
    })
  } catch (error) {
    console.error("Error creating story:", error)
    return NextResponse.json({ success: false, error: "Failed to create story" }, { status: 500 })
  }
}
