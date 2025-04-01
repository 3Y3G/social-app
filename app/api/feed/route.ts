import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const feedType = searchParams.get("type") || "latest"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    let posts
    let totalPosts

    if (feedType === "popular") {
      // Get popular posts based on likes and comments
      posts = await prisma.post.findMany({
        skip,
        take: limit,
        orderBy: [{ likes: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "desc" }],
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

      totalPosts = await prisma.post.count()
    } else if (feedType === "for-you" && session?.user) {
      // Get personalized feed based on user's interests and connections
      // Get posts from friends
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ userId: session.user.id }, { friendId: session.user.id }],
        },
      })

      const friendIds = friendships.map((friendship) =>
        friendship.userId === session.user.id ? friendship.friendId : friendship.userId,
      )

      // Get posts from friends and posts the user has interacted with
      posts = await prisma.post.findMany({
        where: {
          OR: [
            { authorId: { in: friendIds } },
            {
              likes: {
                some: {
                  userId: session.user.id,
                },
              },
            },
            {
              comments: {
                some: {
                  authorId: session.user.id,
                },
              },
            },
          ],
        },
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

      totalPosts = await prisma.post.count({
        where: {
          OR: [
            { authorId: { in: friendIds } },
            {
              likes: {
                some: {
                  userId: session.user.id,
                },
              },
            },
            {
              comments: {
                some: {
                  authorId: session.user.id,
                },
              },
            },
          ],
        },
      })
    } else {
      // Get latest posts
      posts = await prisma.post.findMany({
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

      totalPosts = await prisma.post.count()
    }

    const totalPages = Math.ceil(totalPosts / limit)

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
    console.error("Error fetching feed:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch feed" }, { status: 500 })
  }
}

