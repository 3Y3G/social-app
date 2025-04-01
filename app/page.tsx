import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Feed from "@/components/Feed"
import Stories from "@/components/Stories"
import RightSidebar from "@/components/RightSidebar"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex w-full">
      <div className="flex-1 w-full max-w-full">
        <div className="container-fix">
          <Stories />
          <Feed />
        </div>
      </div>
      <RightSidebar />
    </div>
  )
}

