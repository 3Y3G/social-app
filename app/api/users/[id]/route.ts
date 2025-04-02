import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"

type FriendRequestInfo = {
  id: string
  status: "PENDING" | "ACCEPTED" | "REJECTED"
  isOutgoing: boolean
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id: userId } = (await props.params)
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    let isFriend = false
    let friendRequest: FriendRequestInfo | null = null

    if (session?.user) {
      const currentUserId = session.user.id

      // Check friendship status using the correct field names from the schema
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: currentUserId, friendId: userId },
            { userId: userId, friendId: currentUserId },
          ],
        },
      })

      isFriend = !!friendship

      // Only check for friend requests if not already friends
      if (!isFriend) {
        const outgoingRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: currentUserId,
            recipientId: userId,
            status: "PENDING", // Only consider pending requests
          },
        })

        const incomingRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: userId,
            recipientId: currentUserId,
            status: "PENDING", // Only consider pending requests
          },
        })

        if (outgoingRequest) {
          friendRequest = {
            id: outgoingRequest.id,
            status: outgoingRequest.status as "PENDING" | "ACCEPTED" | "REJECTED",
            isOutgoing: true,
          }
        } else if (incomingRequest) {
          friendRequest = {
            id: incomingRequest.id,
            status: incomingRequest.status as "PENDING" | "ACCEPTED" | "REJECTED",
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

