import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Add import for utility functions
import {
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/lib/api-utils";

// Add import for validation schema
import { conversationSchema } from "@/lib/validation";
import { groupConversationSchema } from "@/lib/validation";

// Get all conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
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
    });

    // Format conversations for the client
    const formattedConversations = conversations.map((conversation) => {
      // Filter out current user from participants
      const otherParticipants = conversation.participants.filter(
        (p) => p.userId !== session.user.id
      );

      // Get current user's participant record
      const currentUserParticipant = conversation.participants.find(
        (p) => p.userId === session.user.id
      );

      // Get last message
      const lastMessage = conversation.messages[0];

      // Calculate unread count
      let unreadCount = 0;
      if (lastMessage && currentUserParticipant?.lastRead) {
        if (
          new Date(lastMessage.createdAt) >
            new Date(currentUserParticipant.lastRead) &&
          lastMessage.senderId !== session.user.id
        ) {
          unreadCount = 1;
        }
      } else if (lastMessage && lastMessage.senderId !== session.user.id) {
        unreadCount = 1;
      }

      if (conversation.isGroup) {
        return {
          id: conversation.id,
          isGroup: true,
          groupName: conversation.groupName,
          groupDescription: conversation.groupDescription,
          participants: otherParticipants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            isOnline: p.user.isOnline,
            lastActive: p.user.lastActive,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                senderId: lastMessage.senderId,
                senderName: lastMessage.sender.name,
                createdAt: lastMessage.createdAt,
                isRead: lastMessage.readReceipts.some(
                  (receipt) => receipt.userId !== lastMessage.senderId
                ),
              }
            : null,
          unreadCount,
        };
      } else {
        // Single conversation
        const otherUser = otherParticipants[0]?.user;

        return {
          id: conversation.id,
          isGroup: false,
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
                isRead: lastMessage.readReceipts.some(
                  (receipt) => receipt.userId !== lastMessage.senderId
                ),
              }
            : null,
          unreadCount,
        };
      }
    });

    return successResponse(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return errorResponse("Failed to fetch conversations", 500);
  }
}

// Update the POST function to use validation schema and handle group conversations
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await request.json();

    // Validate input - supports both single and group
    const result = body.participantIds
      ? groupConversationSchema.safeParse(body)
      : conversationSchema.safeParse(body);

    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message);
    }

    let participantIds: string[];
    let groupName: string | undefined;
    let groupDescription: string | undefined;

    if ("participantIds" in result.data) {
      participantIds = result.data.participantIds;
      groupName = result.data.groupName;
      groupDescription = result.data.groupDescription;
    } else {
      participantIds = [result.data.participantId];
    }

    // Check if all participants exist
    const participants = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        name: true,
        image: true,
        isOnline: true,
        lastActive: true,
      },
    });

    if (participants.length !== participantIds.length) {
      return notFoundResponse("One or more participants not found.");
    }

    // Handle 1-on-1 conversation deduplication
    if (participantIds.length === 1) {
      const possibleConversations = await prisma.conversation.findMany({
        where: {
          AND: [
            {
              participants: {
                some: { userId: session.user.id },
              },
            },
            {
              participants: {
                some: { userId: participantIds[0] },
              },
            },
            {
              isGroup: false,
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
      });

      const existingConversation = possibleConversations.find(
        (conv) => conv.participants.length === 2
      );

      if (existingConversation) {
        const otherUser = existingConversation.participants.find(
          (p) => p.userId === participantIds[0]
        )?.user;

        return successResponse({
          id: existingConversation.id,
          isGroup: false,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                name: otherUser.name,
                image: otherUser.image,
                isOnline: otherUser.isOnline,
                lastActive: otherUser.lastActive,
              }
            : null,
        });
      }
    }

    // Create new conversation
    const allParticipantIds = [session.user.id, ...participantIds];

    const newConversation = await prisma.conversation.create({
      data: {
        groupName,
        groupDescription,
        isGroup: participantIds.length > 1,
        participants: {
          create: allParticipantIds.map((userId) => ({ userId })),
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
    });

    // Format response
    if (newConversation.isGroup) {
      return successResponse({
        id: newConversation.id,
        isGroup: true,
        groupName: newConversation.groupName,
        groupDescription: newConversation.groupDescription,
        participants: newConversation.participants
          .filter((p) => p.userId !== session.user.id)
          .map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            isOnline: p.user.isOnline,
            lastActive: p.user.lastActive,
          })),
      });
    } else {
      const otherUser = newConversation.participants.find(
        (p) => p.userId !== session.user.id
      )?.user;

      return successResponse({
        id: newConversation.id,
        isGroup: false,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              name: otherUser.name,
              image: otherUser.image,
              isOnline: otherUser.isOnline,
              lastActive: otherUser.lastActive,
            }
          : null,
      });
    }
  } catch (error: any) {
    console.error("Error creating conversation:", error?.message || error);
    return errorResponse("Failed to create conversation", 500);
  }
}
