"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("posts")

  const posts = [
    { id: 1, content: "Just finished a great coding session!", likes: 15, comments: 3 },
    {
      id: 2,
      content: "Check out this amazing sunset!",
      image: "/placeholder.svg?height=300&width=500",
      likes: 32,
      comments: 8,
    },
  ]

  const friends = [
    { id: 1, name: "Alice Johnson", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 2, name: "Bob Williams", avatar: "/placeholder.svg?height=40&width=40" },
    { id: 3, name: "Carol Davis", avatar: "/placeholder.svg?height=40&width=40" },
  ]

  const photos = [
    { id: 1, src: "/placeholder.svg?height=150&width=150", alt: "Photo 1" },
    { id: 2, src: "/placeholder.svg?height=150&width=150", alt: "Photo 2" },
    { id: 3, src: "/placeholder.svg?height=150&width=150", alt: "Photo 3" },
    { id: 4, src: "/placeholder.svg?height=150&width=150", alt: "Photo 4" },
  ]

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="posts" onClick={() => setActiveTab("posts")}>
          Posts
        </TabsTrigger>
        <TabsTrigger value="friends" onClick={() => setActiveTab("friends")}>
          Friends
        </TabsTrigger>
        <TabsTrigger value="photos" onClick={() => setActiveTab("photos")}>
          Photos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="posts">
        <Card>
          <CardContent className="p-4">
            {posts.map((post) => (
              <div key={post.id} className="mb-4 border-b pb-4 last:border-b-0 last:pb-0">
                <p>{post.content}</p>
                {post.image && <img src={post.image || "/placeholder.svg"} alt="Post" className="mt-2 rounded-lg" />}
                <div className="mt-2 flex items-center space-x-4">
                  <Button variant="ghost" size="sm">
                    Like ({post.likes})
                  </Button>
                  <Button variant="ghost" size="sm">
                    Comment ({post.comments})
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="friends">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex flex-col items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={friend.avatar} alt={friend.name} />
                    <AvatarFallback>{friend.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 text-sm font-medium">{friend.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="photos">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => (
                <img key={photo.id} src={photo.src || "/placeholder.svg"} alt={photo.alt} className="rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

