import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get stories from the last 24 hours
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const stories = await prisma.story.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
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
    const image = formData.get("image") as File
    const caption = formData.get("caption") as string

    if (!image) {
      return NextResponse.json({ success: false, error: "Image is required" }, { status: 400 })
    }

    // In a real implementation, you would upload the image to a storage service
    // For now, we'll just use a placeholder URL
    const imageUrl = "/placeholder.svg?height=800&width=450"

    const story = await prisma.story.create({
      data: {
        image: imageUrl,
        caption: caption || null,
        authorId: session.user.id,
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

