import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { enable2FA } from "@/lib/auth-security";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from "@/lib/api-utils";
import { z } from "zod";

const enable2FASchema = z.object({
  token: z
    .string()
    .min(6, "Кодът трябва да бъде 6 цифри")
    .max(6, "Кодът трябва да бъде 6 цифри"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return errorResponse("Неоторизиран достъп", 401);
    }

    const body = await req.json();
    const result = enable2FASchema.safeParse(body);

    if (!result.success) {
      return badRequestResponse(result.error.errors[0].message);
    }

    const { token } = result.data;
    const enableResult = await enable2FA(session.user.id, token);

    if (!enableResult.success) {
      return errorResponse(enableResult.error!, 400);
    }

    return successResponse(
      { backupCodes: enableResult.backupCodes },
      "Двуфакторната автентификация беше активирана успешно"
    );
  } catch (error) {
    console.error("2FA enable error:", error);
    return errorResponse("Възникна грешка при активирането на 2FA", 500);
  }
}
