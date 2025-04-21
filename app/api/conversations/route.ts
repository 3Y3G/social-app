import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Add import for utility functions
import {
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/lib/api-utils"

// Add import for validation schema
import { conversationSchema } from "@/lib/validation"

// Get all conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return unauthorizedResponse()
    }

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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastActive: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
            readReceipts: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Format conversations for the client
    const formattedConversations = conversations.map((conversation) => {
      // Filter out current user from participants
      const otherParticipants = conversation.participants.filter((p) => p.userId !== session.user.id)

      // Get the other user's info (for 1:1 chats)
      const otherUser = otherParticipants[0]?.user

      // Get current user's participant record
      const currentUserParticipant = conversation.participants.find((p) => p.userId === session.user.id)

      // Get last message
      const lastMessage = conversation.messages[0]

      // Calculate unread count
      let unreadCount = 0
      if (lastMessage && currentUserParticipant?.lastRead) {
        // If the last message is after the user's last read and not from the current user
        if (
          new Date(lastMessage.createdAt) > new Date(currentUserParticipant.lastRead) &&
          lastMessage.senderId !== session.user.id
        ) {
          unreadCount = 1
        }
      } else if (lastMessage && lastMessage.senderId !== session.user.id) {
        // If there's no last read timestamp and the message is not from the current user
        unreadCount = 1
      }

      return {
        id: conversation.id,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              image: otherUser.image,
              isOnline: otherUser.isOnline,
              lastActive: otherUser.lastActive,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.name,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.readReceipts.some((receipt) => receipt.userId !== lastMessage.senderId),
            }
          : null,
        unreadCount,
      }
    })

    return successResponse(formattedConversations)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return errorResponse("Failed to fetch conversations", 500)
  }
}

// Update the POST function to use validation schema
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    // Validate input
    const result = conversationSchema.safeParse(body)
    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message)
    }

    const { participantId } = result.data

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    })

    if (!participant) {
      return notFoundResponse("Participant")
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: session.user.id,
              },
            },
          },
          {
            participants: {
              some: {
                userId: participantId,
              },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastActive: true,
              },
            },
          },
        },
      },
    })

    if (existingConversation) {
      // Format the existing conversation
      const otherUser = existingConversation.participants.find((p) => p.userId === participantId)?.user

      return successResponse({
        id: existingConversation.id,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              image: otherUser.image,
              isOnline: otherUser.isOnline,
              lastActive: otherUser.lastActive,
            }
          : null,
      })
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: session.user.id }, { userId: participantId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastActive: true,
              },
            },
          },
        },
      },
    })

    // Format the new conversation
    const otherUser = newConversation.participants.find((p) => p.userId === participantId)?.user

    return successResponse({
      id: newConversation.id,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            image: otherUser.image,
            isOnline: otherUser.isOnline,
            lastActive: otherUser.lastActive,
          }
        : null,
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return errorResponse("Failed to create conversation", 500)
  }
}
