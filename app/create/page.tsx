import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CreatePostForm from "./components/CreatePostForm"
import { getDrafts } from "@/lib/post-actions"
import type { UIDraft } from "@/lib/types"

export default async function CreatePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const draftsResult = await getDrafts()

  const drafts: UIDraft[] = draftsResult.success ? draftsResult.data : []

  return (
    <div className="flex-1 max-w-4xl mx-auto py-6 px-4 md:px-6">
      <h1 className="text-2xl font-bold mb-6">Създаване на нова публикация</h1>
      <CreatePostForm drafts={drafts} />
    </div>
  )
}
