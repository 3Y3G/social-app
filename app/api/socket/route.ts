import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// This is a workaround for Next.js App Router to handle WebSocket connections
// In a production app, you might want to use a separate WebSocket server
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // Update user presence
  await prisma.userPresence.upsert({
    where: { userId: session.user.id },
    update: { isOnline: true, lastActive: new Date() },
    create: { userId: session.user.id, isOnline: true },
  })

  return NextResponse.json({ success: true })
}
