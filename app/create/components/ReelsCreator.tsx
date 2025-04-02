"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Edit, Music, Timer, FastForwardIcon as Speed, FileUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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

interface ReelsCreatorProps {
  mediaItems: MediaItem[]
  onAdd: (newMedia: MediaItem[]) => void
  onRemove: (index: number) => void
  onEdit: (index: number) => void
}

export default function ReelsCreator({ mediaItems, onAdd, onRemove, onEdit }: ReelsCreatorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showAudioControls, setShowAudioControls] = useState(false)
  const [audioVolume, setAudioVolume] = useState(100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [clipDuration, setClipDuration] = useState(60) // seconds

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

    // For Reels, we only allow one video at a time
    if (mediaItems.length > 0) {
      setError("You can only upload one video for Reels. Please remove the existing first.")
      return
    }

    const newMediaItems: MediaItem[] = []

    for (const file of files) {
      // Validate file type - only videos for Reels
      const isVideo = file.type.startsWith("video/")

      if (!isVideo) {
        setError("Only video files are allowed for Reels")
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
        type: "video",
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
      {mediaItems.length === 0 ? (
        // Upload area
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
          <p className="text-sm text-gray-500 mb-1">Drag and drop or click to upload a video for your Reel</p>
          <p className="text-xs text-gray-400">Supports MP4, MOV, WebM (max 100MB)</p>

          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        </div>
      ) : (
        // Video preview and controls
        <div className="space-y-4">
          <div className="relative aspect-[9/16] max-h-[500px] overflow-hidden rounded-md border">
            <video src={mediaItems[0].preview} className="w-full h-full object-cover" controls autoPlay muted loop />

            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-black bg-opacity-50 text-white"
                onClick={() => onEdit(0)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full bg-black bg-opacity-50"
                onClick={() => onRemove(0)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reel editing controls */}
          <div className="space-y-4 border border-neutral-200 rounded-md p-4 dark:border-neutral-800 dark:border-neutral-800">
            <h3 className="text-sm font-medium">Reel Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex items-center justify-center"
                onClick={() => setShowAudioControls(!showAudioControls)}
              >
                <Music className="mr-2 h-4 w-4" />
                Add Audio
              </Button>

              <Button variant="outline" className="flex items-center justify-center" onClick={() => onEdit(0)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Video
              </Button>
            </div>

            {showAudioControls && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Audio Volume</Label>
                    <span className="text-xs">{audioVolume}%</span>
                  </div>
                  <Slider
                    value={[audioVolume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setAudioVolume(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Add Music Track</Label>
                  <Input placeholder="Search for music..." />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center">
                  <Speed className="h-4 w-4 mr-2" />
                  Playback Speed
                </Label>
                <span className="text-xs">{playbackSpeed}x</span>
              </div>
              <Slider
                value={[playbackSpeed * 10]}
                min={5}
                max={20}
                step={1}
                onValueChange={(value) => setPlaybackSpeed(value[0] / 10)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center">
                  <Timer className="h-4 w-4 mr-2" />
                  Clip Duration (seconds)
                </Label>
                <span className="text-xs">{clipDuration}s</span>
              </div>
              <Slider
                value={[clipDuration]}
                min={5}
                max={60}
                step={1}
                onValueChange={(value) => setClipDuration(value[0])}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

