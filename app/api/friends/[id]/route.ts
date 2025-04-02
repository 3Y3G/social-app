import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Remove friend
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if friendship exists using the correct field names
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            userId: session.user.id,
            friendId: params.id,
          },
          {
            userId: params.id,
            friendId: session.user.id,
          },
        ],
      },
    })

    if (!friendship) {
      return NextResponse.json({ success: false, error: "Friendship not found" }, { status: 404 })
    }

    // Delete friendship
    await prisma.friendship.delete({
      where: { id: friendship.id },
    })

    return NextResponse.json({
      success: true,
      data: { message: "Friend removed successfully" },
    })
  } catch (error) {
    console.error("Error removing friend:", error)
    return NextResponse.json({ success: false, error: "Failed to remove friend" }, { status: 500 })
  }
}
