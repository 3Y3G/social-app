import type { NextRequest } from "next/server"
import { verify2FA } from "@/lib/auth-security"
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api-utils"
import { z } from "zod"

const verify2FASchema = z.object({
  userId: z.string(),
  token: z.string().min(1, "Кодът е задължителен"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = verify2FASchema.safeParse(body)

    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message)
    }

    const { userId, token } = result.data
    const verifyResult = await verify2FA(userId, token)

    if (!verifyResult.success) {
      return errorResponse(verifyResult.error!, 400)
    }

    return successResponse({
      verified: true,
      usedBackupCode: verifyResult.usedBackupCode || false,
    })
  } catch (error) {
    console.error("2FA verify error:", error)
    return errorResponse("Възникна грешка при проверката на кода", 500)
  }
}
