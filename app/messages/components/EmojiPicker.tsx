"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "👍",
    "👎",
    "👏",
    "🙌",
    "👋",
    "❤️",
    "💔",
    "💯",
    "✅",
    "🎉",
  ]

  return (
    <Card ref={ref} className="w-64 z-50">
      <CardContent className="p-2">
        <div className="grid grid-cols-8 gap-1">
          {emojis.map((emoji, index) => (
            <Button key={index} variant="ghost" className="h-8 w-8 p-0" onClick={() => onEmojiSelect(emoji)}>
              {emoji}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

