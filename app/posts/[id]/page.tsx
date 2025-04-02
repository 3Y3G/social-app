import { Suspense } from "react"
import { notFound } from "next/navigation"
import PostDetail from "./components/PostDetail"
import CommentSection from "./components/CommentSection"

export default async function PostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!params.id) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto flex gap-4 px-4 py-4">
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

