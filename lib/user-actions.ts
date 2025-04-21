"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sanitizeUser } from "@/lib/utils"
import { z } from "zod"
import { hash, compare } from "bcryptjs"

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Името трябва да бъде поне 2 символа").optional(),
  bio: z.string().max(500, "Биографията трябва да бъде по-малко от 500 символа").optional(),
  location: z.string().max(100, "Местоположението трябва да бъде по-малко от 100 символа").optional(),
  occupation: z.string().max(100, "Професията трябва да бъде по-малко от 100 символа").optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
})

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Текущата парола е задължителна"),
  newPassword: z.string().min(8, "Новата парола трябва да бъде поне 8 символа"),
})

const accountSettingsSchema = z.object({
  language: z.string().min(2).max(5),
  theme: z.enum(["light", "dark", "system"]),
})

const privacySettingsSchema = z.object({
  profileVisibility: z.enum(["public", "friends", "private"]),
  messagePermissions: z.enum(["everyone", "friends", "none"]),
  showOnlineStatus: z.boolean(),
  showReadReceipts: z.boolean(),
})

// Update user profile
export async function updateProfile(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Неоторизиран достъп" }
    }

    const payload = {
      name: formData.get("name") || undefined,
      bio: formData.get("bio") || undefined,
      location: formData.get("location") || undefined,
      occupation: formData.get("occupation") || undefined,
      image: formData.get("image") || undefined,
      coverImage: formData.get("coverImage") || undefined,
    }

    const result = profileUpdateSchema.safeParse(payload)
    if (!result.success) {
      return {
        success: false,
        error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(" | ")
      }
    }

    // Filter out undefined values to avoid overwriting with null
    const filteredData = Object.fromEntries(Object.entries(result.data).filter(([_, value]) => value !== undefined))

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: filteredData,
    })

    revalidatePath("/profile")
    revalidatePath("/settings")

    return { success: true, data: sanitizeUser(updatedUser) }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Възникна грешка при обновяването на профила" }
  }
}

// Update user password
export async function updatePassword(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Неоторизиран достъп" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string

    const result = passwordUpdateSchema.safeParse({ currentPassword, newPassword })
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.password) {
      return { success: false, error: "Няма зададена парола за този акаунт" }
    }

    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: "Текущата парола е неправилна" }
    }

    const hashed = await hash(newPassword, 10)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })

    return { success: true, data: { message: "Паролата е обновена успешно" } }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, error: "Възникна грешка при обновяването на паролата" }
  }
}

// Update privacy settings
export async function updatePrivacySettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Неоторизиран достъп" }
    }

    const payload = {
      profileVisibility: formData.get("profileVisibility") as string,
      messagePermissions: formData.get("messagePermissions") as string,
      showOnlineStatus: formData.get("showOnlineStatus") === "true",
      showReadReceipts: formData.get("showReadReceipts") === "true",
    }

    const result = privacySettingsSchema.safeParse(payload)
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    // Update the user's privacy settings in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileVisibility: result.data.profileVisibility,
        messagePermissions: result.data.messagePermissions,
        showOnlineStatus: result.data.showOnlineStatus,
        showReadReceipts: result.data.showReadReceipts,
      },
    })

    revalidatePath("/settings")
    return { success: true, data: { message: "Настройките за поверителност са обновени успешно" } }
  } catch (error) {
    console.error("Error updating privacy settings:", error)
    return { success: false, error: "Възникна грешка при обновяването на настройките за поверителност" }
  }
}

// Update account settings
export async function updateAccountSettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Неоторизиран достъп" }
    }

    const payload = {
      language: formData.get("language") as string,
      theme: formData.get("theme") as "light" | "dark" | "system",
    }

    const result = accountSettingsSchema.safeParse(payload)
    if (!result.success) {
      return { success: false, error: result.error.errors[0].message }
    }

    // Update the user's account settings in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        language: result.data.language,
        theme: result.data.theme,
      },
    })

    revalidatePath("/settings")
    return { success: true, data: { message: "Настройките на акаунта са обновени успешно" } }
  } catch (error) {
    console.error("Error updating account settings:", error)
    return { success: false, error: "Възникна грешка при обновяването на настройките на акаунта" }
  }
}
