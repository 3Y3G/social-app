"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"

type MediaItem = {
  file: File
  type: "image" | "video"
  preview: string
  filters?: string[]
  edits?: {
    brightness?: number
    contrast?: number
    saturation?: number
    crop?: { x: number; y: number; width: number; height: number }
  }
}

interface MediaCarouselProps {
  mediaItems: MediaItem[]
  caption: string
  tags: string[]
  location: string
  mentions: string[]
}

export default function MediaCarousel({ mediaItems, caption, tags, location, mentions }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
  }

  // Format caption with mentions highlighted
  const formatCaption = (text: string) => {
    return text.replace(/@(\w+)/g, "'<span class=text-blue-500>@$1</span>'")
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
          <div>
            <p className="text-sm font-medium">Your Username</p>
            {location && (
              <p className="text-xs text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="aspect-square max-h-[500px] overflow-hidden">
          {mediaItems[currentIndex].type === "image" ? (
            <img
              src={mediaItems[currentIndex].preview || "/placeholder.svg"}
              alt={`Preview ${currentIndex}`}
              className={`object-contain w-full h-full ${
                mediaItems[currentIndex].filters?.[0]
                  ? `filter-${mediaItems[currentIndex].filters[0].toLowerCase()}`
                  : ""
              }`}
            />
          ) : (
            <video
              src={mediaItems[currentIndex].preview}
              className={`object-contain w-full h-full ${
                mediaItems[currentIndex].filters?.[0]
                  ? `filter-${mediaItems[currentIndex].filters[0].toLowerCase()}`
                  : ""
              }`}
              controls
              autoPlay
              muted
              loop
            />
          )}
        </div>

        {mediaItems.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 opacity-80"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 opacity-80"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
              {mediaItems.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full ${index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: formatCaption(caption) }} />

        {tags.length > 0 && <p className="text-sm text-blue-500 mb-2">{tags.map((tag) => `#${tag}`).join("")}</p>}

        <p className="text-xs text-gray-500">Just now</p>
      </div>
    </div>
  )
}

