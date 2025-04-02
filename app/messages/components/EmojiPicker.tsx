"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  const emojiCategories = {
    smileys: [
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
    ],
    gestures: [
      "👍",
      "👎",
      "👏",
      "🙌",
      "👋",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "👌",
      "🤏",
      "👈",
      "👉",
      "👆",
      "👇",
      "☝️",
      "✋",
      "🤚",
      "🖐️",
      "🖖",
    ],
    hearts: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "♥️",
    ],
    symbols: [
      "✅",
      "❌",
      "⭕",
      "🔴",
      "🟠",
      "🟡",
      "🟢",
      "🔵",
      "🟣",
      "⚫",
      "⚪",
      "🟤",
      "🔺",
      "🔻",
      "💠",
      "🔷",
      "🔶",
      "🔹",
      "🔸",
      "🔘",
    ],
  }

  return (
    <Card ref={ref} className="w-64 z-50">
      <CardContent className="p-2">
        <Tabs defaultValue="smileys">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="smileys">😀</TabsTrigger>
            <TabsTrigger value="gestures">👍</TabsTrigger>
            <TabsTrigger value="hearts">❤️</TabsTrigger>
            <TabsTrigger value="symbols">✅</TabsTrigger>
          </TabsList>

          <TabsContent value="smileys">
            <div className="grid grid-cols-8 gap-1">
              {emojiCategories.smileys.map((emoji, index) => (
                <Button key={index} variant="ghost" className="h-8 w-8 p-0" onClick={() => onEmojiSelect(emoji)}>
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gestures">
            <div className="grid grid-cols-8 gap-1">
              {emojiCategories.gestures.map((emoji, index) => (
                <Button key={index} variant="ghost" className="h-8 w-8 p-0" onClick={() => onEmojiSelect(emoji)}>
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hearts">
            <div className="grid grid-cols-8 gap-1">
              {emojiCategories.hearts.map((emoji, index) => (
                <Button key={index} variant="ghost" className="h-8 w-8 p-0" onClick={() => onEmojiSelect(emoji)}>
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="symbols">
            <div className="grid grid-cols-8 gap-1">
              {emojiCategories.symbols.map((emoji, index) => (
                <Button key={index} variant="ghost" className="h-8 w-8 p-0" onClick={() => onEmojiSelect(emoji)}>
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

