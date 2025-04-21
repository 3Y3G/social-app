import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Delete a saved item
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if saved item exists and belongs to user
    const savedItem = await prisma.savedItem.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!savedItem) {
      return NextResponse.json({ success: false, error: "Saved item not found" }, { status: 404 })
    }

    // Delete saved item
    await prisma.savedItem.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: "Saved item deleted" },
    })
  } catch (error) {
    console.error("Error deleting saved item:", error)
    return NextResponse.json({ success: false, error: "Failed to delete saved item" }, { status: 500 })
  }
}
