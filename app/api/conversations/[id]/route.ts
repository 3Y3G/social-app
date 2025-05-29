import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get a specific conversation with messages
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const conversationId = (await props.params).id;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "Not authorized to view this conversation" },
        { status: 403 }
      );
    }

    // Get conversation with messages
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
            createdAt: "asc",
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            readReceipts: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Format conversation for the client
    const otherParticipants = conversation.participants.filter(
      (p) => p.userId !== session.user.id
    );

    // Format messages
    const messages = conversation.messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: message.sender,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
      deletedAt: message.deletedAt,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      readReceipts: message.readReceipts,
    }));

    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId,
        },
      },
      data: {
        lastRead: new Date(),
      },
    });

    if (conversation.isGroup) {
      return NextResponse.json({
        success: true,
        data: {
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
          messages,
        },
      });
    } else {
      const otherUser = otherParticipants[0]?.user;

      return NextResponse.json({
        success: true,
        data: {
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
          messages,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
