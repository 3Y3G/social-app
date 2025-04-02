import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Mark a notification as read
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        recipientId: session.user.id,
      },
    })

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 })
    }

    // Mark as read
    await prisma.notification.update({
      where: {
        id: params.id,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: "Notification marked as read" },
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ success: false, error: "Failed to mark notification as read" }, { status: 500 })
  }
}

// Delete a notification
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        recipientId: session.user.id,
      },
    })

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 })
    }

    // Delete notification
    await prisma.notification.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: "Notification deleted" },
    })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ success: false, error: "Failed to delete notification" }, { status: 500 })
  }
}

