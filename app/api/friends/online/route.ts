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

    // Get current user's friends
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

    // Extract friend data
    const friends = friendships.map((friendship) => {
      const friendData = friendship.userId === session.user.id ? friendship.friend : friendship.user

      return {
        ...friendData,
        friendshipId: friendship.id,
      }
    })

    // In a real app, you would check which friends are online
    // based on their last activity timestamp or a presence system
    // For now, we'll simulate online status
    const onlineFriends = friends
      .map((friend) => ({
        ...friend,
        isOnline: Math.random() > 0.5, // Randomly determine online status
        lastActive: new Date().toISOString(),
      }))
      .filter((friend) => friend.isOnline)

    return NextResponse.json({ success: true, data: onlineFriends })
  } catch (error) {
    console.error("Error fetching online friends:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch online friends" }, { status: 500 })
  }
}

