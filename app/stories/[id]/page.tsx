import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import StoryViewer from "./components/StoryViewer"

export default async function StoryPage({ params }: { params: { id: string } }) {
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
    include: {
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

  return <StoryViewer story={story} currentUserId={session.user.id} />
}

