import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Make sure to await params if needed
  const postId = params.id

  // Check if the user has already liked the post
  const like = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId: session.user.id,
        postId: postId,
      },
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      liked: !!like,
    },
  })
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Make sure to await params if needed
  const postId = params.id

  // Check if the user has already liked the post
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId: session.user.id,
        postId: postId,
      },
    },
  })

  if (existingLike) {
    // If the user has already liked the post, unlike it
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        liked: false,
      },
    })
  } else {
    // If the user hasn't liked the post, like it
    await prisma.like.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        liked: true,
      },
    })
  }
}
