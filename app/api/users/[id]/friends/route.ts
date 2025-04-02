import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const userId = params.id

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get all friendships where the user is involved
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: userId }, { friendId: userId }],
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

    // Extract the actual "friend" (the other user in the relationship)
    const friends = friendships.map((friendship) =>
      friendship.user.id === userId ? friendship.friend : friendship.user,
    )

    return NextResponse.json({ success: true, data: friends })
  } catch (error) {
    console.error("Error fetching user friends:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user friends" }, { status: 500 })
  }
}
