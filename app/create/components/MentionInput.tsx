"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDebounce } from "@/hooks/use-debounce"

interface MentionInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  onChange: (value: string) => void
  onMentionsChange: (mentions: string[]) => void
}

interface User {
  id: string
  name: string
  image: string | null
  username: string
}

export default function MentionInput({ value, onChange, onMentionsChange, className, ...props }: MentionInputProps) {
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionResults, setMentionResults] = useState<User[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentions, setMentions] = useState<string[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionsRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(mentionSearch, 300)

  // Search for users when mention search changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 0) {
      fetchUsers(debouncedSearch)
    } else {
      setMentionResults([])
    }
  }, [debouncedSearch])

  // Handle click outside to close mentions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mentionsRef.current && !mentionsRef.current.contains(event.target as Node)) {
        setShowMentions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Extract mentions from text
  useEffect(() => {
    const mentionRegex = /@(\w+)/g
    const foundMentions = []
    let match

    while ((match = mentionRegex.exec(value)) !== null) {
      foundMentions.push(match[1])
    }

    setMentions(foundMentions)
    onMentionsChange(foundMentions)
  }, [value, onMentionsChange])

  const fetchUsers = async (query: string) => {
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockUsers: User[] = [
        { id: "1", name: "John Doe", username: "johndoe", image: null },
        { id: "2", name: "Jane Smith", username: "janesmith", image: null },
        { id: "3", name: "Alice Johnson", username: "alicej", image: null },
        { id: "4", name: "Bob Brown", username: "bobbrown", image: null },
        { id: "5", name: "Charlie Davis", username: "charlied", image: null },
      ]

      const filteredUsers = mockUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase()),
      )

      setMentionResults(filteredUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      setMentionResults([])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Get cursor position
    const cursorPos = e.target.selectionStart || 0
    setCursorPosition(cursorPos)

    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1])
      setShowMentions(true)
    } else {
      setMentionSearch("")
      setShowMentions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle navigation in mention results
    if (showMentions && mentionResults.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()

        if (e.key === "Escape") {
          setShowMentions(false)
        }
      }
    }
  }

  const insertMention = (user: User) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart || 0

    // Find the start of the mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const startPos = cursorPos - mentionMatch[0].length
      const beforeMention = value.substring(0, startPos)
      const afterMention = value.substring(cursorPos)

      // Insert the mention
      const newValue = `${beforeMention}@${user.username} ${afterMention}`
      onChange(newValue)

      // Set cursor position after the mention
      const newCursorPos = startPos + user.username.length + 2 // @ + username + space
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    }

    setShowMentions(false)
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />

      {showMentions && mentionResults.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute z-10 mt-1 w-full max-w-xs bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto dark:border-neutral-800 dark:border-neutral-800"
        >
          <ul className="py-1">
            {mentionResults.map((user) => (
              <li
                key={user.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => insertMention(user)}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

