import { Suspense } from "react"
import { notFound } from "next/navigation"
import PostDetail from "./components/PostDetail"
import CommentSection from "./components/CommentSection"
import { Card, CardContent } from "@/components/ui/card"

export default async function PostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!params.id) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Suspense fallback={
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </CardContent>
            </Card>
          }>
            <PostDetail postId={params.id} />
          </Suspense>
          <Suspense fallback={
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </CardContent>
            </Card>
          }>
            <CommentSection postId={params.id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
