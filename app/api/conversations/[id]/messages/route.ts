import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getIO } from "@/lib/socket-server"

// Send a new message
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = (await props.params).id

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "Not authorized to send messages in this conversation" },
        { status: 403 },
      )
    }

    const { content, mediaUrl, mediaType } = await request.json()

    if (!content && !mediaUrl) {
      return NextResponse.json({ success: false, error: "Message content or media is required" }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content || "",
        mediaUrl,
        mediaType,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Create read receipt for sender
    await prisma.readReceipt.create({
      data: {
        userId: session.user.id,
        messageId: message.id,
      },
    })

    // Get other participants to send notifications
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: {
          not: session.user.id,
        },
      },
      select: {
        userId: true,
      },
    })

    // Create notifications for other participants
    for (const otherParticipant of otherParticipants) {
      await prisma.notification.create({
        data: {
          type: "NEW_MESSAGE",
          content: "ти изпрати съобщение",
          senderId: session.user.id,
          recipientId: otherParticipant.userId,
          conversationId, // Using postId to store conversationId
        },
      })
    }

    // Emit message via WebSocket if available
    const io = getIO()
    if (io) {
      io.to(`conversation:${conversationId}`).emit("new-message", message)

      // Emit notifications to other participants
      for (const otherParticipant of otherParticipants) {
        io.to(`user:${otherParticipant.userId}`).emit("notification", {
          type: "NEW_MESSAGE",
          message,
        })
      }
    }

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}
