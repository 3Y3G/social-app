import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { generate2FASecret } from "@/lib/auth-security"
import { successResponse, errorResponse } from "@/lib/api-utils"
import { authenticator } from "otplib"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return errorResponse("Неоторизиран достъп", 401)
    }

    const secret = await generate2FASecret(session.user.id)

    const qrCode = authenticator.keyuri(session.user.email!, "SocialApp", secret)

    return successResponse({
      secret,
      qrCode,
      manualEntryKey: secret,
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return errorResponse("Възникна грешка при настройката на 2FA", 500)
  }
}
