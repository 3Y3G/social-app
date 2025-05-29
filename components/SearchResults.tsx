"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import type { SafeUser, PostWithAuthor } from "@/lib/types"

type SearchResultsProps = {
  initialQuery?: string
}

export default function SearchResults({ initialQuery }: SearchResultsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = initialQuery || searchParams.get("q") || ""
  const [users, setUsers] = useState<SafeUser[]>([])
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!query) return

    async function fetchSearchResults() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
        const data = await response.json()

        if (data.success) {
          setUsers(data.data.users || [])
          setPosts(data.data.posts || [])
        } else {
          setError(data.error || "Неуспешно извличане на резултатите от търсене")
        }
      } catch (error) {
        setError("Възникна грешка при търсене")
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query, activeTab])

  if (!query) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Въведете заявка за търсене, за да намерите потребители или публикации
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Резултати от търсенето за „{query}“</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Всички</TabsTrigger>
            <TabsTrigger value="users">Потребители</TabsTrigger>
            <TabsTrigger value="posts">Публикации</TabsTrigger>
          </TabsList>

          {loading && <p className="text-center">Зареждане на резултатите...</p>}
          {error && <p className="text-center text-red-500">Грешка: {error}</p>}

          {!loading && !error && (
            <>
              <TabsContent value="all">
                {users.length === 0 && posts.length === 0 ? (
                  <p className="text-center text-gray-500">Няма намерени резултати</p>
                ) : (
                  <>
                    {users.length > 0 && (
                      <div className="mb-6">
                        <h3 className="mb-2 text-lg font-semibold">Потребители</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {users.map((user) => (
                            <Card key={user.id}>
                              <CardContent className="flex items-center p-4">
                                <Avatar className="mr-4">
                                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">
                                    {user.name}
                                  </Link>
                                  {user.occupation && <p className="text-sm text-gray-500">{user.occupation}</p>}
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/profile/${user.id}`}>Виж профил</Link>
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {posts.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-lg font-semibold">Публикации</h3>
                        <div className="space-y-4">
                          {posts.map((post) => (
                            <Card key={post.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center mb-2">
                                  <Avatar className="mr-2">
                                    <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
                                    <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                                      {post.author.name}
                                    </Link>
                                    <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                                  </div>
                                </div>
                                <p className="mb-2">{post.content}</p>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/posts/${post.id}`}>Виж публикация</Link>
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="users">
                {users.length === 0 ? (
                  <p className="text-center text-gray-500">Няма намерени потребители</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {users.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="flex items-center p-4">
                          <Avatar className="mr-4">
                            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Link href={`/profile/${user.id}`} className="font-semibold hover:underline">
                              {user.name}
                            </Link>
                            {user.occupation && <p className="text-sm text-gray-500">{user.occupation}</p>}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/profile/${user.id}`}>Виж профил</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts">
                {posts.length === 0 ? (
                  <p className="text-center text-gray-500">Няма намерени публикации</p>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <Avatar className="mr-2">
                              <AvatarImage src={post.author.image || undefined} alt={post.author.name || ""} />
                              <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                                {post.author.name}
                              </Link>
                              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                            </div>
                          </div>
                          <p className="mb-2">{post.content}</p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/posts/${post.id}`}>Виж публикация</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
