import { Suspense } from "react"
import { notFound } from "next/navigation"
import Header from "../../components/Header"
import LeftSidebar from "../../components/LeftSidebar"
import PostDetail from "./components/PostDetail"
import CommentSection from "./components/CommentSection"

export default function PostPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <LeftSidebar />
        <div className="flex-1 space-y-4">
          <Suspense fallback={<div>Loading post...</div>}>
            <PostDetail postId={params.id} />
          </Suspense>
          <Suspense fallback={<div>Loading comments...</div>}>
            <CommentSection postId={params.id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

