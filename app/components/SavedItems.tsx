"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, LinkIcon, Image, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { SavedItemWithPost } from "@/lib/types"

export default function SavedItems() {
  const [savedItems, setSavedItems] = useState<SavedItemWithPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchSavedItems()
  }, [activeTab])

  const fetchSavedItems = async () => {
    try {
      setLoading(true)
      const url = activeTab === "all" ? "/api/saved" : `/api/saved?type=${activeTab.toUpperCase()}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setSavedItems(data.data)
      } else {
        setError(data.error || "Failed to fetch saved items")
      }
    } catch (error) {
      setError("An error occurred while fetching saved items")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSavedItem = async (id: string) => {
    try {
      const response = await fetch(`/api/saved/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setSavedItems(savedItems.filter((item) => item.id !== id))
        toast({
          title: "Success",
          description: "Item removed from saved items",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove saved item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while removing saved item",
        variant: "destructive",
      })
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "POST":
        return <Bookmark className="h-5 w-5" />
      case "LINK":
        return <LinkIcon className="h-5 w-5" />
      case "IMAGE":
        return <Image className="h-5 w-5" />
      default:
        return <Bookmark className="h-5 w-5" />
    }
  }

  if (loading) return <div className="text-center py-8">Loading saved items...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Saved Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="post">Posts</TabsTrigger>
              <TabsTrigger value="link">Links</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {savedItems.length === 0 ? (
                <div className="text-center py-8">
                  <p>No saved items found</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {savedItems.map((item) => (
                    <li key={item.id}>
                      <Card>
                        <CardContent className="flex items-center p-4">
                          <div className="mr-4">{getItemIcon(item.type)}</div>
                          <div className="flex-1">
                            {item.type === "POST" && item.post ? (
                              <>
                                <Link href={`/posts/${item.post.id}`} className="font-semibold hover:underline">
                                  Post by {item.post.author.name}
                                </Link>
                                <p className="line-clamp-2">{item.post.content}</p>
                              </>
                            ) : (
                              <h3 className="font-semibold">{item.type.toLowerCase()}</h3>
                            )}
                            <p className="text-sm text-gray-500">Saved on {formatDate(item.createdAt)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteSavedItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

