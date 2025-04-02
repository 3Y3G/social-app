"use client"

import { useState, type KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Hash } from "lucide-react"

interface TagInputProps {
  tags: string[]
  setTags: (tags: string[]) => void
}

export default function TagInput({ tags, setTags }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter or Space
    if ((e.key === "Enter" || e.key === "") && inputValue.trim()) {
      e.preventDefault()

      // Format tag (remove # if present, lowercase, remove spaces)
      const formattedTag = inputValue.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "")

      if (formattedTag && !tags.includes(formattedTag)) {
        setTags([...tags, formattedTag])
        setInputValue("")
      }
    }

    // Remove last tag on Backspace if input is empty
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      const newTags = [...tags]
      newTags.pop()
      setTags(newTags)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full hover:bg-gray-200 p-0.5">
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Add tags (press Enter or Space to add)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8"
        />
      </div>
    </div>
  )
}

