"use client"

import { useState, useEffect } from "react"
import PostCard from "@/components/PostCard"
import { Button } from "@/components/ui/button"
import type { PostWithAuthor } from "@/lib/types"

export default function Feed() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async (pageToFetch = 1) => {
    try {
      if (pageToFetch === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/posts?page=${pageToFetch}&limit=10`)
      const data = await response.json()

      if (data.success) {
        if (pageToFetch === 1) {
          setPosts(data.data)
        } else {
          setPosts((prevPosts) => [...prevPosts, ...data.data])
        }

        setHasMore(data.data.length === 10)
        setPage(pageToFetch)
      } else {
        setError(data.error || "Failed to fetch posts")
      }
    } catch (error) {
      setError("An error occurred while fetching posts")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full">
      <div className="space-y-4 w-full max-w-full">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Follow some users to see their posts!</p>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

