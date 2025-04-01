import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get all friendships where the current user is involved
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: session.user.id }, { friendId: session.user.id }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            occupation: true,
            location: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            role: true,
            coverImage: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            occupation: true,
            location: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
            role: true,
            coverImage: true,
          },
        },
      },
    })

    // Map the friendships to get the friend data
    const friends = friendships.map((friendship) => {
      const friendData = friendship.userId === session.user.id ? friendship.friend : friendship.user

      return {
        ...friendData,
        friendshipId: friendship.id,
      }
    })

    return NextResponse.json({ success: true, data: friends })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch friends" }, { status: 500 })
  }
}

