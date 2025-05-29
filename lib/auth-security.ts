import { randomBytes } from "crypto";
import { authenticator } from "otplib";
import prisma from "@/lib/prisma";
import { sendPasswordReset, sendSecurityAlert } from "@/lib/email";

// Email verification
export async function generateEmailVerificationToken(
  userId: string,
  email: string
) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return { success: false, error: "Невалиден или изтекъл токен" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  return { success: true, user };
}

// Password reset
export async function generatePasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Потребител с този имейл не съществува");
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  await sendPasswordReset(email, token, user.name || "Потребител");
  return token;
}

export async function verifyPasswordResetToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return { success: false, error: "Невалиден или изтекъл токен" };
  }

  return { success: true, user };
}

export async function resetPassword(token: string, newPassword: string) {
  const verification = await verifyPasswordResetToken(token);

  if (!verification.success) {
    return verification;
  }

  const { hash } = await import("bcrypt");
  const hashedPassword = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: verification.user!.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  await sendSecurityAlert(
    verification.user!.email || "",
    verification.user!.name || "Потребител",
    "Паролата беше променена",
    {}
  );

  return { success: true };
}

// Two-Factor Authentication
export async function generate2FASecret(userId: string) {
  const secret = authenticator.generateSecret();

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return secret;
}

export async function enable2FA(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.twoFactorSecret) {
    return {
      success: false,
      error: "Няма настроена двуфакторна автентификация",
    };
  }

  const isValid = authenticator.verify({
    token,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return { success: false, error: "Невалиден код" };
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(4).toString("hex").toUpperCase()
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      backupCodes,
    },
  });

  return { success: true, backupCodes };
}

export async function verify2FA(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return {
      success: false,
      error: "Двуфакторната автентификация не е активирана",
    };
  }

  // Check if it's a backup code
  if (user.backupCodes && user.backupCodes.includes(token.toUpperCase())) {
    // Remove used backup code
    const updatedCodes = user.backupCodes.filter(
      (code) => code !== token.toUpperCase()
    );
    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updatedCodes },
    });
    return { success: true, usedBackupCode: true };
  }

  // Verify TOTP token
  const isValid = authenticator.verify({
    token,
    secret: user.twoFactorSecret,
  });

  return { success: isValid };
}

// Account lockout
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string,
  userAgent?: string
) {
  await prisma.loginAttempt.create({
    data: {
      email,
      success,
      ipAddress,
      userAgent,
    },
  });

  if (!success) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const attempts = user.loginAttempts + 1;
      const lockoutUntil =
        attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockoutUntil,
        },
      });

      if (lockoutUntil) {
        await sendSecurityAlert(
          email,
          user.name || "Потребител",
          "Акаунтът беше заключен поради многократни неуспешни опити за вход",
          { ipAddress, userAgent }
        );
      }
    }
  } else {
    // Reset login attempts on successful login
    await prisma.user.updateMany({
      where: { email },
      data: {
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });
  }
}

export async function isAccountLocked(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.lockoutUntil) {
    return false;
  }

  if (user.lockoutUntil <= new Date()) {
    // Lockout expired, reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });
    return false;
  }

  return true;
}

// Session management
export async function createSession(userId: string, request: Request) {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress = getClientIP(request);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      userAgent,
      ipAddress,
      deviceInfo: parseUserAgent(userAgent),
    },
  });

  return sessionToken;
}

export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeSession(sessionId: string, userId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { success: false, error: "Сесията не беше намерена" };
  }

  await prisma.session.delete({
    where: { id: sessionId },
  });

  return { success: true };
}

export async function revokeAllSessions(
  userId: string,
  currentSessionId?: string
) {
  await prisma.session.deleteMany({
    where: {
      userId,
      id: currentSessionId ? { not: currentSessionId } : undefined,
    },
  });

  return { success: true };
}

// Helper functions
function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

function parseUserAgent(userAgent?: string): string {
  if (!userAgent) return "Unknown Device";

  // Simple user agent parsing
  if (userAgent.includes("Mobile")) return "Mobile Device";
  if (userAgent.includes("Tablet")) return "Tablet";
  if (userAgent.includes("Chrome")) return "Chrome Browser";
  if (userAgent.includes("Firefox")) return "Firefox Browser";
  if (userAgent.includes("Safari")) return "Safari Browser";

  return "Desktop Browser";
}
