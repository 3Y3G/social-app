"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Image, Video } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// Define type for drafts
type Draft = {
  id: string
  caption: string
  tags: string[]
  location: string
  mentions: string[]
  mediaItems: {
    file: File
    type: "image" | "video"
    preview: string
    filters?: string[]
    edits?: any
  }[]
  createdAt: string
}

interface DraftSelectorProps {
  drafts: Draft[]
  onSelect: (draft: Draft) => void
  selectedDraft: Draft | null
}

export default function DraftSelector({ drafts, onSelect, selectedDraft }: DraftSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (draft: Draft) => {
    onSelect(draft)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          {selectedDraft ? "Current Draft" : "Чернови"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Чернови</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You don't have any drafts yet</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${selectedDraft?.id === draft.id ? "ring-2 ring-neutral-900 dark:ring-neutral-50" : ""
                    }`}
                  onClick={() => handleSelect(draft)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {draft.mediaItems.length > 0 ? (
                        draft.mediaItems[0].type === "image" ? (
                          <img
                            src={draft.mediaItems[0].preview || "/placeholder.svg"}
                            alt="Draft preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-800 text-white">
                            <Video className="h-8 w-8" />
                          </div>
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{draft.caption || "No caption"}</p>

                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          {draft.mediaItems.length > 0 ? (
                            <>
                              {draft.mediaItems.filter((m) => m.type === "image").length > 0 && (
                                <span className="flex items-center mr-2">
                                  <Image className="h-3 w-3 mr-1" />
                                  {draft.mediaItems.filter((m) => m.type === "image").length}
                                </span>
                              )}

                              {draft.mediaItems.filter((m) => m.type === "video").length > 0 && (
                                <span className="flex items-center mr-2">
                                  <Video className="h-3 w-3 mr-1" />
                                  {draft.mediaItems.filter((m) => m.type === "video").length}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="mr-2">Text only</span>
                          )}
                        </span>

                        <span className="ml-auto">
                          {formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {draft.tags.length > 0 && (
                        <p className="text-xs text-blue-500 truncate mt-1">
                          {draft.tags.map((tag) => `#${tag}`).join("")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

