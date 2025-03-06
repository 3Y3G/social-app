"use client";
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share2 } from "lucide-react"

const posts = [
  {
    id: 1,
    author: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    content: "Just finished a great book! What are you all reading these days?",
    likes: 15,
    comments: [
      { id: 1, author: "Jane Smith", content: "I'm reading \"The Midnight Library\". It's fantastic!" },
      { id: 2, author: "Mike Johnson", content: 'I just started "Atomic Habits". Highly recommend it!' },
    ],
    shares: 1,
  },
  {
    id: 2,
    author: "Jane Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    content: "Beautiful day for a hike! 🏞️",
    image: "/placeholder.svg?height=300&width=500",
    likes: 32,
    comments: [{ id: 3, author: "Alice Williams", content: "Looks amazing! Where is this?" }],
    shares: 2,
  },
]

export default function Feed() {
  const [newPost, setNewPost] = useState("")
  const [expandedComments, setExpandedComments] = useState<number[]>([])

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the new post to your backend
    console.log("New post:", newPost)
    setNewPost("")
  }

  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  return (
    <div className="flex-1 space-y-4">
      <Card>
        <CardHeader>
          <form onSubmit={handlePostSubmit}>
            <Textarea placeholder="What's on your mind?" value={newPost} onChange={(e) => setNewPost(e.target.value)} />
            <CardFooter className="px-0">
              <Button type="submit">Post</Button>
            </CardFooter>
          </form>
        </CardHeader>
      </Card>

      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={post.avatar} alt={post.author} />
                <AvatarFallback>{post.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.author}</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p>{post.content}</p>
            {post.image && <img src={post.image || "/placeholder.svg"} alt="Post image" className="mt-4 rounded-lg" />}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost">
              <Heart className="mr-2 h-4 w-4" />
              {post.likes}
            </Button>
            <Button variant="ghost" onClick={() => toggleComments(post.id)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {post.comments.length}
            </Button>
            <Button variant="ghost">
              <Share2 className="mr-2 h-4 w-4" />
              {post.shares}
            </Button>
          </CardFooter>
          {expandedComments.includes(post.id) && (
            <CardContent>
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar>
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{comment.author}</p>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                ))}
                <form className="flex items-center space-x-2">
                  <Input placeholder="Write a comment..." />
                  <Button type="submit">Send</Button>
                </form>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

