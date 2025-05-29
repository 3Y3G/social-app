import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getUserSessions,
  revokeSession,
  revokeAllSessions,
} from "@/lib/auth-security";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return errorResponse("Неоторизиран достъп", 401);
    }

    const sessions = await getUserSessions(session.user.id);

    return successResponse(sessions);
  } catch (error) {
    console.error("Get sessions error:", error);
    return errorResponse("Възникна грешка при зареждането на сесиите", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return errorResponse("Неоторизиран достъп", 401);
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const revokeAll = searchParams.get("all") === "true";

    if (revokeAll) {
      await revokeAllSessions(session.user.id);
      return successResponse({}, "Всички сесии бяха прекратени");
    }

    if (!sessionId) {
      return errorResponse("Липсва идентификатор на сесия", 400);
    }

    const result = await revokeSession(sessionId, session.user.id);

    if (!result.success) {
      return errorResponse(result.error!, 400);
    }

    return successResponse({}, "Сесията беше прекратена");
  } catch (error) {
    console.error("Revoke session error:", error);
    return errorResponse("Възникна грешка при прекратяването на сесията", 500);
  }
}
