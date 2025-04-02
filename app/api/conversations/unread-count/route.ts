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

    // Get all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        participants: {
          where: {
            userId: session.user.id,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    })

    // Count unread messages
    let unreadCount = 0

    for (const conversation of conversations) {
      if (conversation.messages.length > 0) {
        const lastMessage = conversation.messages[0]
        const userParticipant = conversation.participants[0]

        // If the last message is after the user's last read timestamp and not from the current user
        if (
          lastMessage.senderId !== session.user.id &&
          (!userParticipant.lastRead || new Date(lastMessage.createdAt) > new Date(userParticipant.lastRead))
        ) {
          unreadCount++
        }
      }
    }

    return NextResponse.json({ success: true, data: { count: unreadCount } })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch unread count" }, { status: 500 })
  }
}

