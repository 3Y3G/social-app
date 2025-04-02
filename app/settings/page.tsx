import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import SettingsForm from "./components/SettingsForm"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <Suspense fallback={<div>Loading settings...</div>}>
          <SettingsForm user={session.user} />
        </Suspense>
      </main>
    </div>
  )
}

