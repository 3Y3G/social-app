import Header from "./components/Header"
import LeftSidebar from "./components/LeftSidebar"
import Feed from "./components/Feed"
import RightSidebar from "./components/RightSidebar"
import Stories from "./components/Stories"
import CreatePost from "./components/CreatePost"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <div className="flex-1 space-y-4">
          <Stories />
          <CreatePost />
          <Feed />
        </div>
        <RightSidebar />
      </main>
    </div>
  )
}

