import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const requestId = params.id
    const { action } = await request.json()

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    })

    if (!friendRequest) {
      return NextResponse.json({ success: false, error: "Friend request not found" }, { status: 404 })
    }

    // Check if the user is the recipient of the request
    if (friendRequest.recipientId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not authorized to handle this request" }, { status: 403 })
    }

    if (action === "accept") {
      // Create friendship
      await prisma.friendship.create({
        data: {
          userId: friendRequest.senderId,
          friendId: friendRequest.recipientId,
        },
      })

      // Update request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      })

      // Create notification for the sender
      await prisma.notification.create({
        data: {
          type: "FRIEND_ACCEPT",
          content: "accepted your friend request",
          senderId: session.user.id,
          recipientId: friendRequest.senderId,
        },
      })
    } else {
      // Update request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling friend request:", error)
    return NextResponse.json({ success: false, error: "Failed to handle friend request" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const requestId = params.id

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!friendRequest) {
      return NextResponse.json({ success: false, error: "Friend request not found" }, { status: 404 })
    }

    // Check if the user is the sender of the request
    if (friendRequest.senderId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not authorized to delete this request" }, { status: 403 })
    }

    // Delete the friend request
    await prisma.friendRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting friend request:", error)
    return NextResponse.json({ success: false, error: "Failed to delete friend request" }, { status: 500 })
  }
}

