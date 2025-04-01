import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: sanitizeUser(user) })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const occupation = formData.get("occupation") as string
    const location = formData.get("location") as string
    const bio = formData.get("bio") as string
    const image = formData.get("image") as string
    const coverImage = formData.get("coverImage") as string

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        occupation,
        location,
        bio,
        image,
        coverImage,
      },
    })

    return NextResponse.json({ success: true, data: sanitizeUser(updatedUser) })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ success: false, error: "Failed to update user profile" }, { status: 500 })
  }
}

