import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get total count for pagination
    const totalPosts = await prisma.post.count({
      where: { authorId: userId },
    })
    const totalPages = Math.ceil(totalPosts / limit)

    // Get user posts with author and counts
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      skip,
      take: limit,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: posts,
      meta: {
        page,
        limit,
        pages: totalPages,
        total: totalPosts,
      },
    })
  } catch (error) {
    console.error("Error fetching user posts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user posts" }, { status: 500 })
  }
}

