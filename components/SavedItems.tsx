// Файл: SavedItems.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { SavedItemWithPost } from "@/lib/types"

export default function SavedItems() {
  const [savedItems, setSavedItems] = useState<SavedItemWithPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSavedItems()
  }, [])

  const fetchSavedItems = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/saved")
      const data = await response.json()

      if (data.success) {
        setSavedItems(data.data)
      } else {
        setError(data.error || "Неуспешно зареждане на запазените елементи")
      }
    } catch {
      setError("Възникна грешка при зареждане на запазените елементи")
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
        setSavedItems((prev) => prev.filter((item) => item.id !== id))
        toast({
          title: "Успешно",
          description: "Елементът беше премахнат от запазените",
        })
      } else {
        toast({
          title: "Грешка",
          description: data.error || "Неуспешно премахване на елемент",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Грешка",
        description: "Възникна грешка при премахването на елемент",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Зареждане на запазените...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Грешка: {error}</div>
  }

  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Запазени елементи</CardTitle>
        </CardHeader>
        <CardContent>
          {savedItems.length === 0 ? (
            <div className="text-center py-8">
              <p>Няма запазени елементи</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {savedItems.map((item) => (
                <li key={item.id}>
                  <Card>
                    <CardContent className="flex items-center p-4">
                      <div className="flex-1">
                        {item.post ? (
                          <>
                            <Link
                              href={`/posts/${item.post.id}`}
                              className="font-semibold hover:underline"
                            >
                              Публикация от {item.post.author.name}
                            </Link>
                            <p className="line-clamp-2">{item.post.content}</p>
                          </>
                        ) : (
                          <h3 className="font-semibold">Запазен елемент</h3>
                        )}
                        <p className="text-sm text-gray-500">
                          Запазено на {formatDate(item.createdAt)}
                        </p>
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
        </CardContent>
      </Card>
    </div>
  )
}
