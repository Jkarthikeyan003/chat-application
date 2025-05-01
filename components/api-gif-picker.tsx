"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2, Film, User, Tag, MapPin } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GifItem {
  _id: string
  id: string
  title: string
  url: string
  clipLink?: string
  preview: string
  clipThumbnailUrl?: string
  thumbnailUrl?: string
  tags?: string[]
  moods?: string[]
  mood?: string
  movieName?: string
  artist?: string
  characterNames?: string[]
  transcript?: string
  property?: string
  place?: string
  createdAt?: string
}

interface ApiGifPickerProps {
  onGifSelect: (gifUrl: string, thumbnailUrl: string, mood?: string) => void
  onClose: () => void
  messageContext?: {
    id?: string
    content?: string
    type?: "text" | "gif"
    gifMood?: string
  } | null
}

export function ApiGifPicker({ onGifSelect, onClose, messageContext }: ApiGifPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiSuggestedGifs, setAiSuggestedGifs] = useState<GifItem[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [searchCategory, setSearchCategory] = useState<string>("all")

  // Load all GIFs at once from the media collection
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        setLoading(true)
        setError(null)

        const endpoint = "/api/gifs?limit=60" // Request all 60 GIFs at once

        // If we have message context, use it to get contextual GIFs
        if (messageContext && messageContext.content) {
          // First, fetch all regular GIFs
          const response = await fetch(endpoint)

          if (!response.ok) {
            throw new Error(`Failed to fetch GIFs: ${response.status}`)
          }

          const data = await response.json()

          if (data.success) {
            console.log("Fetched GIFs:", data.data.length)
            setGifs(data.data || [])
          } else {
            throw new Error(data.message || "Failed to fetch GIFs")
          }

          // Then, fetch AI-suggested GIFs
          try {
            const aiResponse = await fetch(`/api/gifs/ai-filter`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messageText: messageContext.content,
                limit: 8,
              }),
            })

            if (aiResponse.ok) {
              const aiData = await aiResponse.json()
              if (aiData.success && aiData.data && aiData.data.gifs) {
                setAiSuggestedGifs(aiData.data.gifs)
                setShowAiSuggestions(true)
              }
            }
          } catch (aiError) {
            console.error("Error fetching AI GIF suggestions:", aiError)
            // Don't set error state, just log it - we still have regular GIFs
          }
        } else {
          // Just fetch all regular GIFs
          const response = await fetch(endpoint)

          if (!response.ok) {
            throw new Error(`Failed to fetch GIFs: ${response.status}`)
          }

          const data = await response.json()

          if (data.success) {
            console.log("Fetched GIFs:", data.data.length)
            setGifs(data.data || [])
          } else {
            throw new Error(data.message || "Failed to fetch GIFs")
          }
        }
      } catch (err) {
        console.error("Error fetching GIFs:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchGifs()
  }, [messageContext])

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      setError(null)
      setShowAiSuggestions(false) // Hide AI suggestions when searching

      const response = await fetch(`/api/gifs?q=${encodeURIComponent(searchQuery)}&limit=60`)

      if (!response.ok) {
        throw new Error(`Failed to search GIFs: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("Search results:", data.data.length)
        setGifs(data.data || [])
      } else {
        throw new Error(data.message || "Failed to search GIFs")
      }
    } catch (err) {
      console.error("Error searching GIFs:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Get the primary display info for a GIF based on search category
  const getGifDisplayInfo = (gif: GifItem): { primary: string; icon: React.ReactNode } => {
    switch (searchCategory) {
      case "movie":
        return {
          primary: gif.movieName || "Unknown Movie",
          icon: <Film size={12} className="mr-1" />,
        }
      case "artist":
        return {
          primary: gif.artist || "Unknown Artist",
          icon: <User size={12} className="mr-1" />,
        }
      case "character":
        return {
          primary: gif.characterNames?.[0] || "Unknown Character",
          icon: <User size={12} className="mr-1" />,
        }
      case "place":
        return {
          primary: gif.place || "Unknown Location",
          icon: <MapPin size={12} className="mr-1" />,
        }
      case "mood":
        return {
          primary: gif.mood || gif.tags?.[0] || "Unknown Mood",
          icon: <Tag size={12} className="mr-1" />,
        }
      default:
        return {
          primary: gif.tags?.[0] || gif.mood || "GIF",
          icon: <Tag size={12} className="mr-1" />,
        }
    }
  }

  return (
    <div className="gif-picker p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Select a GIF</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X size={18} />
        </Button>
      </div>

      <div className="search-bar flex mb-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button onClick={handleSearch} className="ml-2">
          <Search size={18} />
        </Button>
      </div>

      <div className="search-categories flex flex-wrap gap-1 mb-3">
        {["all", "movie", "artist", "character", "mood", "place"].map((category) => (
          <Button
            key={category}
            variant={searchCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchCategory(category)}
            className="text-xs"
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {showAiSuggestions && aiSuggestedGifs.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Reply GIFs</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAiSuggestions(false)} className="h-6 w-6 p-0">
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {aiSuggestedGifs.slice(0, 4).map((gif) => {
              const displayInfo = getGifDisplayInfo(gif)
              return (
                <div
                  key={gif._id || gif.id}
                  className="gif-item cursor-pointer rounded overflow-hidden hover:opacity-80 transition-opacity"
                  onClick={() =>
                    onGifSelect(
                      gif.clipLink || gif.url,
                      gif.clipThumbnailUrl || gif.thumbnailUrl || gif.preview,
                      gif.mood || gif.tags?.[0] || (gif.moods && gif.moods[0]),
                    )
                  }
                >
                  <img
                    src={gif.clipThumbnailUrl || gif.thumbnailUrl || gif.preview}
                    alt={gif.title || "GIF"}
                    className="w-full h-16 object-cover"
                  />
                  <div className="bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate flex items-center justify-center">
                    {displayInfo.icon}
                    <span>{displayInfo.primary}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">
          <p>{error}</p>
          <Button onClick={() => handleSearch()} className="mt-2">
            Retry
          </Button>
        </div>
      ) : gifs.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          <p>No GIFs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-[33vh] overflow-y-auto">
          {gifs.map((gif) => {
            const displayInfo = getGifDisplayInfo(gif)
            return (
              <TooltipProvider key={gif._id || gif.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="gif-item cursor-pointer rounded overflow-hidden hover:opacity-80 transition-opacity"
                      onClick={() =>
                        onGifSelect(
                          gif.clipLink || gif.url,
                          gif.clipThumbnailUrl || gif.thumbnailUrl || gif.preview,
                          gif.mood || gif.tags?.[0] || (gif.moods && gif.moods[0]),
                        )
                      }
                    >
                      <img
                        src={gif.clipThumbnailUrl || gif.thumbnailUrl || gif.preview}
                        alt={gif.title || "GIF"}
                        className="w-full h-16 object-cover"
                      />
                      <div className="bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate flex items-center justify-center">
                        {displayInfo.icon}
                        <span>{displayInfo.primary}</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {gif.title && (
                        <p>
                          <strong>Title:</strong> {gif.title}
                        </p>
                      )}
                      {gif.movieName && (
                        <p>
                          <strong>Movie:</strong> {gif.movieName}
                        </p>
                      )}
                      {gif.artist && (
                        <p>
                          <strong>Artist:</strong> {gif.artist}
                        </p>
                      )}
                      {gif.characterNames && gif.characterNames.length > 0 && (
                        <p>
                          <strong>Characters:</strong> {gif.characterNames.join(", ")}
                        </p>
                      )}
                      {gif.place && (
                        <p>
                          <strong>Place:</strong> {gif.place}
                        </p>
                      )}
                      {gif.mood && (
                        <p>
                          <strong>Mood:</strong> {gif.mood}
                        </p>
                      )}
                      {gif.transcript && (
                        <p>
                          <strong>Transcript:</strong> {gif.transcript.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ApiGifPicker
