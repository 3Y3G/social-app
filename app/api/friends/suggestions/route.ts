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
    })

    const friendIds = friendships.map((friendship) =>
      friendship.userId === session.user.id ? friendship.friendId : friendship.userId,
    )

    // Get friends of friends (2nd degree connections)
    const friendsOfFriends = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: { in: friendIds } }, { friendId: { in: friendIds } }],
        AND: [{ userId: { not: session.user.id } }, { friendId: { not: session.user.id } }],
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

    // Extract unique users who are not already friends with the current user
    const potentialFriends = new Map()

    friendsOfFriends.forEach((friendship) => {
      const user1 = friendship.user
      const user2 = friendship.friend

      // Skip if already friends with current user
      if (!friendIds.includes(user1.id) && user1.id !== session.user.id) {
        if (!potentialFriends.has(user1.id)) {
          potentialFriends.set(user1.id, {
            ...user1,
            mutualFriends: 1,
          })
        } else {
          const existing = potentialFriends.get(user1.id)
          potentialFriends.set(user1.id, {
            ...existing,
            mutualFriends: existing.mutualFriends + 1,
          })
        }
      }

      if (!friendIds.includes(user2.id) && user2.id !== session.user.id) {
        if (!potentialFriends.has(user2.id)) {
          potentialFriends.set(user2.id, {
            ...user2,
            mutualFriends: 1,
          })
        } else {
          const existing = potentialFriends.get(user2.id)
          potentialFriends.set(user2.id, {
            ...existing,
            mutualFriends: existing.mutualFriends + 1,
          })
        }
      }
    })

    // Convert to array and sort by mutual friends count
    const suggestions = Array.from(potentialFriends.values())
      .sort((a, b) => b.mutualFriends - a.mutualFriends)
      .slice(0, 5) // Get top 5

    return NextResponse.json({ success: true, data: suggestions })
  } catch (error) {
    console.error("Error fetching friend suggestions:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch friend suggestions" }, { status: 500 })
  }
}

