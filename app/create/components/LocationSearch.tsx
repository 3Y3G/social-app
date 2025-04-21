"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, X } from "lucide-react"

interface LocationSearchProps {
  value: string
  onChange: (location: string) => void
}

// Mock locations for demo purposes
const MOCK_LOCATIONS = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Francisco, CA",
]

export default function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (newValue.trim().length > 1) {
      // Filter mock locations based on input
      const filtered = MOCK_LOCATIONS.filter((location) => location.toLowerCase().includes(newValue.toLowerCase()))
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectLocation = (location: string) => {
    onChange(location)
    setInputValue(location)
    setShowSuggestions(false)
  }

  const handleClearLocation = () => {
    onChange("")
    setInputValue("")
    setSuggestions([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Add location"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.trim().length > 1 && setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          className="pl-8 pr-8"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={handleClearLocation}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto dark:border-neutral-800 dark:border-neutral-800">
          <ul className="py-1">
            {suggestions.map((location, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSelectLocation(location)}
              >
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                {location}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
