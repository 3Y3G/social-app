import type { NextRequest } from "next/server";
import { resetPassword, verifyPasswordResetToken } from "@/lib/auth-security";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/lib/api-utils";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Липсва токен"),
  password: z.string().min(8, "Паролата трябва да бъде поне 8 символа"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Липсва токен за нулиране", 400);
    }

    const result = await verifyPasswordResetToken(token);

    if (!result.success) {
      return errorResponse(result.error!, 400);
    }

    return successResponse({ valid: true }, "Токенът е валиден");
  } catch (error) {
    console.error("Password reset verification error:", error);
    return errorResponse("Възникна грешка при проверката на токена", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message);
    }

    const { token, password } = result.data;

    const resetResult = await resetPassword(token, password);

    if (!resetResult.success && "error" in resetResult) {
      return errorResponse(resetResult.error as string, 400);
    }

    return successResponse({}, "Паролата беше успешно променена");
  } catch (error) {
    console.error("Password reset error:", error);
    return errorResponse("Възникна грешка при нулирането на паролата", 500);
  }
}
