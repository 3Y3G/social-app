import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get conversation participants
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

    // Get conversation participants
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
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
    });

    return NextResponse.json({
      success: true,
      data: participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
        isOnline: p.user.isOnline,
        lastActive: p.user.lastActive,
        joinedAt: p.joinedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching conversation participants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

// Add participants to group conversation
export async function POST(
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
    const { participantIds } = await request.json();

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid participant IDs" },
        { status: 400 }
      );
    }

    // Check if user is a participant and conversation is a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!conversation || conversation.participants.length === 0) {
      return NextResponse.json(
        { success: false, error: "Not authorized to modify this conversation" },
        { status: 403 }
      );
    }

    if (!conversation.isGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot add participants to non-group conversation",
        },
        { status: 400 }
      );
    }

    // Check if users exist
    const users = await prisma.user.findMany({
      where: { id: { in: participantIds } },
    });

    if (users.length !== participantIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more users not found" },
        { status: 404 }
      );
    }

    // Add participants
    const newParticipants = await prisma.conversationParticipant.createMany({
      data: participantIds.map((userId: string) => ({
        userId,
        conversationId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      data: { added: newParticipants.count },
    });
  } catch (error) {
    console.error("Error adding participants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add participants" },
      { status: 500 }
    );
  }
}

// Remove participant from group conversation
export async function DELETE(
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
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: "Participant ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a participant and conversation is a group
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!conversation || conversation.participants.length === 0) {
      return NextResponse.json(
        { success: false, error: "Not authorized to modify this conversation" },
        { status: 403 }
      );
    }

    if (!conversation.isGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot remove participants from non-group conversation",
        },
        { status: 400 }
      );
    }

    // Remove participant
    await prisma.conversationParticipant.delete({
      where: {
        userId_conversationId: {
          userId: participantId,
          conversationId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Participant removed successfully" },
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
