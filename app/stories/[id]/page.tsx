import { notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Header from "@/components/Header"
import StoryViewer from "./components/StoryViewer"

export default async function StoryPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!params.id) {
    return notFound()
  }

  // Fetch the story
  const story = await prisma.story.findUnique({
    where: {
      id: params.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          occupation: true,
          location: true,
          bio: true,
          coverImage: true,
        },
      },
    },
  })

  // Check if story exists and hasn't expired
  if (!story || new Date(story.expiresAt) < new Date()) {
    return notFound()
  }

  // Sanitize user data
  const sanitizedStory = {
    ...story,
    author: {
      ...story.author,
      password: undefined,
    },
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="container mx-auto flex justify-center items-center min-h-[calc(100vh-64px)]">
        <StoryViewer story={sanitizedStory} currentUser={session?.user} />
      </main>
    </div>
  )
}

