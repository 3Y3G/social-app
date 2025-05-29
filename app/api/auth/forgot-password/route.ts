import type { NextRequest } from "next/server";
import { generatePasswordResetToken } from "@/lib/auth-security";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/lib/api-utils";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Невалиден имейл адрес"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message);
    }

    const { email } = result.data;

    try {
      await generatePasswordResetToken(email);

      return successResponse({
        backupCodes: null,
        message:
          "Ако съществува акаунт с този имейл, ще получите инструкции за нулиране на паролата.",
      });
    } catch (error: any) {
      // Don't reveal if email exists or not for security
      return successResponse({
        backupCodes: null,
        message:
          "Ако съществува акаунт с този имейл, ще получите инструкции за нулиране на паролата.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(
      "Възникна грешка при заявката за нулиране на парола",
      500
    );
  }
}
