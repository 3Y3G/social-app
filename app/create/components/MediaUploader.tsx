"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Image, Video, X, Edit, FileUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

// Define types for our media items
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

interface MediaUploaderProps {
  mediaItems: MediaItem[]
  onAdd: (newMedia: MediaItem[]) => void
  onRemove: (index: number) => void
  onEdit: (index: number) => void
  onReorder: (newOrder: MediaItem[]) => void
  maxItems?: number
  acceptedTypes?: Record<string, string[]>
}

function SortableMediaItem({
  item,
  index,
  onRemove,
  onEdit,
}: {
  item: MediaItem
  index: number
  onRemove: () => void
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `item-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border border-neutral-200 rounded-md overflow-hidden group cursor-move dark:border-neutral-800 dark:border-neutral-800"
      {...attributes}
      {...listeners}
    >
      {item.type === "image" ? (
        <img src={item.preview || "/placeholder.svg"} alt={`Preview ${index}`} className="w-full h-32 object-cover" />
      ) : (
        <video src={item.preview} className="w-full h-32 object-cover" controls={false} muted />
      )}

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex space-x-2">
          <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1">
        {item.type === "image" ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
      </div>

      {item.filters && item.filters.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1">
          <span className="text-xs">Edited</span>
        </div>
      )}
    </div>
  )
}

export default function MediaUploader({
  mediaItems,
  onAdd,
  onRemove,
  onEdit,
  onReorder,
  maxItems = 10,
  acceptedTypes = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    "video/*": [".mp4", ".mov", ".avi", ".webm"],
  },
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = Number.parseInt(active.id.split("-")[1])
      const newIndex = Number.parseInt(over.id.split("-")[1])

      const newOrder = [...mediaItems]
      const [movedItem] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, movedItem)

      onReorder(newOrder)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    handleFiles(Array.from(files))

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFiles = async (files: File[]) => {
    setError(null)

    // Check if adding these files would exceed the maximum
    if (mediaItems.length + files.length > maxItems) {
      setError(`You can only upload a maximum of ${maxItems} files`)
      return
    }

    const newMediaItems: MediaItem[] = []

    for (const file of files) {
      // Validate file type
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")

      if (!isImage && !isVideo) {
        setError("Only image and video files are allowed")
        continue
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError("File size should be less than 100MB")
        continue
      }

      // Create preview URL
      const preview = URL.createObjectURL(file)

      newMediaItems.push({
        file,
        type: isImage ? "image" : "video",
        preview,
      })
    }

    if (newMediaItems.length > 0) {
      onAdd(newMediaItems)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  return (
    <div className="space-y-4">
      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-neutral-900 bg-neutral-900/5 dark:border-neutral-50 dark:bg-neutral-50/5"
            : "hover:bg-gray-50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileUp className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500 mb-1">Drag and drop or click to upload</p>
        <p className="text-xs text-gray-400">Supports images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, WebM)</p>
        <p className="text-xs text-gray-400 mt-1">
          {mediaItems.length}/{maxItems} files uploaded
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.entries(acceptedTypes)
            .map(([type, exts]) => `${type},${exts.join(",")}`)
            .join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Media preview grid */}
      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploaded Media ({mediaItems.length})</h3>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={mediaItems.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaItems.map((item, index) => (
                  <SortableMediaItem
                    key={`item-${index}`}
                    item={item}
                    index={index}
                    onRemove={() => onRemove(index)}
                    onEdit={() => onEdit(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-xs text-gray-500">Drag items to reorder. Click on an item to edit or remove it.</p>
        </div>
      )}
    </div>
  )
}

