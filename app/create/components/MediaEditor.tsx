"use client"

import { Label } from "@/components/ui/label"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Save,
  X,
  Crop,
  SunMedium,
  Contrast,
  Palette,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from "lucide-react"

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

interface MediaEditorProps {
  media: MediaItem
  onSave: (updatedMedia: MediaItem) => void
  onCancel: () => void
}

// Define available filters
const FILTERS = [
  { name: "Normal", class: "" },
  { name: "Clarendon", class: "brightness-110 contrast-110 saturate-130" },
  { name: "Gingham", class: "brightness-105 sepia-15" },
  { name: "Moon", class: "grayscale-100 brightness-110" },
  { name: "Lark", class: "brightness-110 contrast-95 saturate-125" },
  { name: "Reyes", class: "brightness-105 contrast-90 saturate-75 sepia-22" },
  { name: "Juno", class: "brightness-105 contrast-115 saturate-180" },
  { name: "Slumber", class: "brightness-90 saturate-85 sepia-20" },
  { name: "Crema", class: "brightness-105 contrast-95 saturate-90 sepia-15" },
  { name: "Ludwig", class: "brightness-105 contrast-105 saturate-105 sepia-10" },
  { name: "Aden", class: "brightness-115 contrast-85 saturate-75 sepia-20" },
  { name: "Perpetua", class: "brightness-105 contrast-110 saturate-110" },
]

export default function MediaEditor({ media, onSave, onCancel }: MediaEditorProps) {
  const [activeTab, setActiveTab] = useState("filters")
  const [selectedFilter, setSelectedFilter] = useState("Normal")
  const [edits, setEdits] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  })
  const [cropSettings, setCropSettings] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Initialize canvas with media
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (media.type === "image") {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = media.preview

      img.onload = () => {
        // Set canvas dimensions to match image
        canvas.width = img.width
        canvas.height = img.height

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Store image reference
        imageRef.current = img
      }
    } else if (media.type === "video") {
      const video = document.createElement("video")
      video.crossOrigin = "anonymous"
      video.src = media.preview
      video.muted = true

      video.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Play and pause to get the first frame
        video.play().then(() => {
          video.pause()
          // Draw video frame on canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Store video reference
          videoRef.current = video
        })
      }
    }

    // Apply existing edits if available
    if (media.edits) {
      setEdits({
        brightness: media.edits.brightness || 100,
        contrast: media.edits.contrast || 100,
        saturation: media.edits.saturation || 100,
      })

      if (media.edits.crop) {
        setCropSettings({
          ...media.edits.crop,
          active: false,
        })
      }
    }

    // Apply existing filter if available
    if (media.filters && media.filters.length > 0) {
      setSelectedFilter(media.filters[0])
    }
  }, [media])

  // Apply edits and filters when they change
  useEffect(() => {
    applyEdits()
  }, [edits, selectedFilter])

  const applyEdits = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw media on canvas
    if (media.type === "image" && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    } else if (media.type === "video" && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    }

    // Apply brightness, contrast, saturation
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const brightness = edits.brightness / 100
    const contrast = edits.contrast / 100
    const saturation = edits.saturation / 100

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] = data[i] * brightness
      data[i + 1] = data[i + 1] * brightness
      data[i + 2] = data[i + 2] * brightness

      // Apply contrast
      data[i] = ((data[i] / 255 - 0.5) * contrast + 0.5) * 255
      data[i + 1] = ((data[i + 1] / 255 - 0.5) * contrast + 0.5) * 255
      data[i + 2] = ((data[i + 2] / 255 - 0.5) * contrast + 0.5) * 255

      // Apply saturation
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = avg + (data[i] - avg) * saturation
      data[i + 1] = avg + (data[i + 1] - avg) * saturation
      data[i + 2] = avg + (data[i + 2] - avg) * saturation
    }

    ctx.putImageData(imageData, 0, 0)

    // Apply filter effects (would be implemented with CSS filters in a real app)
    // Here we're just simulating the effect
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      // Create new file from blob
      const newFile = new File([blob], media.file.name, {
        type: media.file.type,
        lastModified: Date.now(),
      })

      // Create new preview URL
      const newPreview = URL.createObjectURL(blob)

      // Create updated media item
      const updatedMedia: MediaItem = {
        file: newFile,
        type: media.type,
        preview: newPreview,
        filters: selectedFilter !== "Normal" ? [selectedFilter] : undefined,
        edits: {
          brightness: edits.brightness,
          contrast: edits.contrast,
          saturation: edits.saturation,
          crop: cropSettings.active
            ? {
                x: cropSettings.x,
                y: cropSettings.y,
                width: cropSettings.width,
                height: cropSettings.height,
              }
            : undefined,
        },
      }

      onSave(updatedMedia)
    }, media.file.type)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Редактиране на медии</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Отказ
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Запазване на промените
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-md p-4">
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-[500px] ${FILTERS.find((f) => f.name === selectedFilter)?.class || ""}`}
          />
        </div>

        {/* Controls area */}
        <div className="w-full md:w-64 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="filters">Филтри</TabsTrigger>
              <TabsTrigger value="adjust">Настройте</TabsTrigger>
              <TabsTrigger value="crop">Изрязване</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {FILTERS.map((filter) => (
                  <div
                    key={filter.name}
                    className={`cursor-pointer rounded-md overflow-hidden p-1 ${
                      selectedFilter === filter.name ? "ring-2 ring-neutral-900 dark:ring-neutral-50" : ""
                    }`}
                    onClick={() => setSelectedFilter(filter.name)}
                  >
                    <div className={`aspect-square bg-gray-200 ${filter.class}`} />
                    <p className="text-xs text-center mt-1">{filter.name}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="adjust" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <SunMedium className="h-4 w-4 mr-2" />
                      Яркост
                    </Label>
                    <span className="text-xs">{edits.brightness}%</span>
                  </div>
                  <Slider
                    value={[edits.brightness]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setEdits({ ...edits, brightness: value[0] })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <Contrast className="h-4 w-4 mr-2" />
                      Контраст
                    </Label>
                    <span className="text-xs">{edits.contrast}%</span>
                  </div>
                  <Slider
                    value={[edits.contrast]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setEdits({ ...edits, contrast: value[0] })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="flex items-center">
                      <Palette className="h-4 w-4 mr-2" />
                      Насищане
                    </Label>
                    <span className="text-xs">{edits.saturation}%</span>
                  </div>
                  <Slider
                    value={[edits.saturation]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setEdits({ ...edits, saturation: value[0] })}
                  />
                </div>
              </div>

              <div className="flex justify-center space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEdits({ brightness: 100, contrast: 100, saturation: 100 })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Нулиране
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="crop" className="space-y-4">
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCropSettings({ ...cropSettings, active: !cropSettings.active })}
                >
                  <Crop className="h-4 w-4 mr-2" />
                  {cropSettings.active ? "Cancel Crop" : "Start Crop"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Implement rotation logic
                  }}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Завъртете
                </Button>
              </div>

              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Implement flip horizontal logic
                  }}
                >
                  <FlipHorizontal className="h-4 w-4 mr-2" />
                  Обърнете Х
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Implement flip vertical logic
                  }}
                >
                  <FlipVertical className="h-4 w-4 mr-2" />
                  Обърнете В
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
