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

    // Get all friend requests where the current user is the recipient
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        recipientId: session.user.id,
        status: "PENDING",
      },
      include: {
        sender: {
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ success: true, data: friendRequests })
  } catch (error) {
    console.error("Error fetching friend requests:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch friend requests" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId } = await request.json()

    if (!recipientId) {
      return NextResponse.json({ success: false, error: "Recipient ID is required" }, { status: 400 })
    }

    // Check if the recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    })

    if (!recipient) {
      return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 })
    }

    // Check if the user is trying to send a request to themselves
    if (recipientId === session.user.id) {
      return NextResponse.json({ success: false, error: "Cannot send friend request to yourself" }, { status: 400 })
    }

    // Check if they are already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: recipientId },
          { userId: recipientId, friendId: session.user.id },
        ],
      },
    })

    if (existingFriendship) {
      return NextResponse.json({ success: false, error: "Already friends with this user" }, { status: 400 })
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, recipientId },
          { senderId: recipientId, recipientId: session.user.id },
        ],
        status: "PENDING",
      },
    })

    if (existingRequest) {
      return NextResponse.json({ success: false, error: "Friend request already exists" }, { status: 400 })
    }

    // Create the friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        recipientId,
        status: "PENDING",
      },
    })

    // Create notification for the recipient
    await prisma.notification.create({
      data: {
        type: "FRIEND_REQUEST",
        content: "sent you a friend request",
        senderId: session.user.id,
        recipientId,
      },
    })

    return NextResponse.json({ success: true, data: friendRequest })
  } catch (error) {
    console.error("Error sending friend request:", error)
    return NextResponse.json({ success: false, error: "Failed to send friend request" }, { status: 500 })
  }
}
