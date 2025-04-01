"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

type Photo = {
  id: string
  url: string
  createdAt: string
}

export default function UserPhotos({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const { toast } = useToast()
  const isOwnProfile = session?.user?.id === userId

  useEffect(() => {
    fetchPhotos()
  }, [userId])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      // In a real app, you would fetch photos from an API
      // For now, we'll use placeholder images
      const mockPhotos = Array.from({ length: 9 }, (_, i) => ({
        id: `photo-${i}`,
        url: `/placeholder.svg?height=300&width=300&text=Photo+${i + 1}`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }))

      setPhotos(mockPhotos)
      setError(null)
    } catch (error) {
      setError("An error occurred while fetching photos")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading photos...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Photos</CardTitle>
        {isOwnProfile && <Button size="sm">Upload Photo</Button>}
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <p>No photos to display</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md">
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt="User photo"
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

