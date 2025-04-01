import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Header from "./components/Header"
import LeftSidebar from "./components/LeftSidebar"
import Feed from "./components/Feed"
import RightSidebar from "./components/RightSidebar"
import Stories from "./components/Stories"
import CreatePost from "./components/CreatePost"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import FeedNavigation from "./components/FeedNavigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <div className="flex-1 space-y-4">
          {!session && (
            <div className="mb-4 rounded-lg bg-white p-4 shadow">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <h2 className="text-xl font-bold">Welcome to SocialApp</h2>
                  <p className="text-gray-600">Join our community to connect with friends and share your moments</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/login">
                    <Button>Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline">Register</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
          <Stories />
          {session ? <CreatePost /> : null}
          <FeedNavigation />
          <Feed />
        </div>
        <RightSidebar />
      </main>
    </div>
  )
}

