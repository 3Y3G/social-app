import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import EditPostForm from "./components/EditPostForm"

export default async function EditPostPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    // Redirect to login if not authenticated
    if (!session?.user) {
        redirect("/login")
    }

    // Fetch the post
    const post = await prisma.post.findUnique({
        where: { id: params.id },
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

    // Return 404 if post not found
    if (!post) {
        notFound()
    }

    // Check if user is authorized to edit this post
    const isAuthor = post.authorId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isAuthor && !isAdmin) {
        redirect("/") // Redirect to home if not authorized
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
            <EditPostForm post={post} />
        </div>
    )
}
