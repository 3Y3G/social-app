"use client";

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share2, MoreHorizontal, ThumbsUp, Smile } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const posts = [
  {
    id: 1,
    author: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    content: "Just finished a great book! What are you all reading these days?",
    image: null,
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
  const [expandedComments, setExpandedComments] = useState<number[]>([])
  const [likedPosts, setLikedPosts] = useState<number[]>([])

  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]))
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Save Post</DropdownMenuItem>
                  <DropdownMenuItem>Hide Post</DropdownMenuItem>
                  <DropdownMenuItem>Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <p>{post.content}</p>
            {post.image && <img src={post.image || "/placeholder.svg"} alt="Post image" className="mt-4 rounded-lg" />}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLike(post.id)}
              className={likedPosts.includes(post.id) ? "text-blue-600" : ""}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              {post.comments.length}
            </Button>
            <Button variant="ghost" size="sm">
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
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <Input placeholder="Write a comment..." className="flex-1" />
                  <Button size="sm" variant="ghost">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button type="submit" size="sm">
                    Send
                  </Button>
                </form>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

