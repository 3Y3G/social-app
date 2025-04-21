import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser, type SafeUser } from "@/lib/utils"
import { Post } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json({ success: false, error: "Търсене query is required" }, { status: 400 })
    }

    let users: SafeUser[] = []
    let posts: (Post & { author: SafeUser })[] = []

    // Търсене for users
    if (type === "all" || type === "users") {
      const foundUsers = await prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 10,
      })

      users = foundUsers.map((user) => sanitizeUser(user))
    }

    // Търсене for posts
    if (type === "all" || type === "posts") {
      const foundPosts = await prisma.post.findMany({
        where: {
          content: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          author: true,
        },
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      })

      posts = foundPosts.map((post) => ({
        ...post,
        author: sanitizeUser(post.author),
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        posts,
      },
    })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ success: false, error: "Failed to perform search" }, { status: 500 })
  }
}
