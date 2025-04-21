import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import SettingsForm from "./components/SettingsForm"
import { Skeleton } from "@/components/ui/skeleton"
import prisma from "@/lib/prisma"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  // Get additional user data from database
  const userData = await getUserData(session.user.id)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsForm user={userData} />
        </Suspense>
      </main>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="flex-1">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col space-y-1.5">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4 py-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function getUserData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        occupation: true,
        language: true,
        theme: true,
        profileVisibility: true,
        messagePermissions: true,
        showOnlineStatus: true,
        showReadReceipts: true,
      },
    })

    return user || { id: userId }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return { id: userId }
  }
}
