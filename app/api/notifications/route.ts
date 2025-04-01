import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"

// Get all notifications for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: session.user.id,
      },
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Sanitize user data
    const sanitizedNotifications = notifications.map((notification) => ({
      ...notification,
      sender: notification.sender ? sanitizeUser(notification.sender) : null,
    }))

    return NextResponse.json({ success: true, data: sanitizedNotifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// Mark all notifications as read
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: "All notifications marked as read" },
    })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ success: false, error: "Failed to mark notifications as read" }, { status: 500 })
  }
}

