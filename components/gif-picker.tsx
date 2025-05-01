"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void
}

// Mock GIF data for demonstration
const mockGifs = [
  "/startled-cat-fall.png",
  "/joyful-dance-party.png",
  "/joyful-laughter.png",
  "/cheerful-approval.png",
  "/placeholder.svg?height=150&width=150&query=surprised gif",
  "/placeholder.svg?height=150&width=150&query=clapping gif",
  "/placeholder.svg?height=150&width=150&query=eye roll gif",
  "/placeholder.svg?height=150&width=150&query=facepalm gif",
  "/placeholder.svg?height=150&width=150&query=happy dance gif",
  "/placeholder.svg?height=150&width=150&query=cute puppy gif",
  "/placeholder.svg?height=150&width=150&query=excited gif",
  "/placeholder.svg?height=150&width=150&query=confused gif",
]

export default function GifPicker({ onGifSelect }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [gifs, setGifs] = useState(mockGifs)
  const [isLoading, setIsLoading] = useState(false)

  // Simulate searching for GIFs
  useEffect(() => {
    if (searchTerm) {
      setIsLoading(true)

      // Simulate API delay
      const timer = setTimeout(() => {
        // Generate mock search results
        const searchResults = Array(8)
          .fill(null)
          .map((_, i) => `/placeholder.svg?height=150&width=150&query=${searchTerm} gif ${i + 1}`)
        setGifs(searchResults)
        setIsLoading(false)
      }, 500)

      return () => clearTimeout(timer)
    } else {
      setGifs(mockGifs)
    }
  }, [searchTerm])

  return (
    <div className="h-[200px] overflow-y-auto">
      <div className="sticky top-0 bg-white pb-2 z-10">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search GIFs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-[150px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {gifs.map((gif, index) => (
            <button
              key={index}
              onClick={() => onGifSelect(gif)}
              className="overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            >
              <img src={gif || "/placeholder.svg"} alt={`GIF ${index + 1}`} className="w-full h-auto object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
