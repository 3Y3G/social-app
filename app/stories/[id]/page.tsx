import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import StoryViewer from "./components/StoryViewer"

export default async function StoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { id } = params

  // Fetch the story
  const story = await prisma.story.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      image: true,
      caption: true,
      content: true,
      createdAt: true,
      authorId: true,
      expiresAt: true,
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  if (!story) {
    redirect("/")
  }

  return (
    <StoryViewer
      story={{
        ...story,
        createdAt: story.createdAt.toISOString(),
      }}
      currentUserId={session.user.id}
    />
  )
}

