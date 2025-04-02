import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ProfileHeader from "../../components/ProfileHeader"
import UserPosts from "./[id]/components/UserPosts"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <div className="flex-1 space-y-4">
          <ProfileHeader userId={session.user.id} />
          <UserPosts userId={session.user.id} />
        </div>
      </main>
    </div>
  )
}

