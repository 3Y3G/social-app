import { Suspense } from "react"
import { notFound } from "next/navigation"
import ProfileHeader from "../../../components/ProfileHeader"
import UserPosts from "./components/UserPosts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserFriends from "./components/UserFriends"
import UserPhotos from "./components/UserPhotos"

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!params.id) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto flex gap-4 px-4 py-4">
        <div className="flex-1 space-y-4">
          <Suspense fallback={<div>Loading profile...</div>}>
            <ProfileHeader userId={params.id} />
          </Suspense>

          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <Suspense fallback={<div>Loading posts...</div>}>
                <UserPosts userId={params.id} />
              </Suspense>
            </TabsContent>

            <TabsContent value="friends">
              <Suspense fallback={<div>Loading friends...</div>}>
                <UserFriends userId={params.id} />
              </Suspense>
            </TabsContent>

            <TabsContent value="photos">
              <Suspense fallback={<div>Loading photos...</div>}>
                <UserPhotos userId={params.id} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

