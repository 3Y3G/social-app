import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if the current user is friends with the requested user
    let isFriend = false
    let friendRequest = null

    if (session?.user) {
      // Check friendship status
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: session.user.id, friendId: userId },
            { userId: userId, friendId: session.user.id },
          ],
        },
      })

      isFriend = !!friendship

      // Check friend request status
      if (!isFriend) {
        const outgoingRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: session.user.id,
            recipientId: userId,
          },
        })

        const incomingRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: userId,
            recipientId: session.user.id,
          },
        })

        if (outgoingRequest) {
          friendRequest = {
            id: outgoingRequest.id,
            status: outgoingRequest.status,
            isOutgoing: true,
          }
        } else if (incomingRequest) {
          friendRequest = {
            id: incomingRequest.id,
            status: incomingRequest.status,
            isOutgoing: false,
          }
        }
      }
    }

    const userData = sanitizeUser(user)
    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        isFriend,
        friendRequest,
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user profile" }, { status: 500 })
  }
}

