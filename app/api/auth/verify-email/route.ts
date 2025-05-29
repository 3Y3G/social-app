import type { NextRequest } from "next/server";
import { verifyEmailToken } from "@/lib/auth-security";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Липсва токен за потвърждение", 400);
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return errorResponse(result.error!, 400);
    }

    return successResponse(
      {},
      "Имейлът беше успешно потвърден. Сега можете да влезете в акаунта си."
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse("Възникна грешка при потвърждаването на имейла", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return errorResponse("Липсва токен за потвърждение", 400);
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return errorResponse(result.error!, 400);
    }

    return successResponse(
      {},
      "Имейлът беше успешно потвърден. Сега можете да влезете в акаунта си."
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse("Възникна грешка при потвърждаването на имейла", 500);
  }
}
