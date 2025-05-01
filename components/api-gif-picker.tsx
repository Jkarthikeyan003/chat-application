"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2 } from "lucide-react"

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
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [aiSuggestedGifs, setAiSuggestedGifs] = useState<any[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load initial GIFs or suggested GIFs based on message context
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        setLoading(true)
        setError(null)
        setPage(1) // Reset pagination when loading new GIFs

        const endpoint = "/api/gifs"

        // If we have message context, use it to get contextual GIFs
        if (messageContext && messageContext.content) {
          // First, fetch regular GIFs
          const response = await fetch(`${endpoint}?page=1&limit=12`)

          if (!response.ok) {
            throw new Error(`Failed to fetch GIFs: ${response.status}`)
          }

          const data = await response.json()

          if (data.success) {
            setGifs(data.data || [])
            setHasMore(data.data.length >= 12)
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
          // Just fetch regular GIFs
          const response = await fetch(`${endpoint}?page=1&limit=12`)

          if (!response.ok) {
            throw new Error(`Failed to fetch GIFs: ${response.status}`)
          }

          const data = await response.json()

          if (data.success) {
            setGifs(data.data || [])
            setHasMore(data.data.length >= 12)
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
      setPage(1) // Reset pagination when searching
      setShowAiSuggestions(false) // Hide AI suggestions when searching

      const response = await fetch(`/api/gifs?q=${encodeURIComponent(searchQuery)}&page=1&limit=12`)

      if (!response.ok) {
        throw new Error(`Failed to search GIFs: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setGifs(data.data || [])
        setHasMore(data.data.length >= 12)
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

  // Load more GIFs when scrolling
  const loadMoreGifs = async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      const nextPage = page + 1

      const endpoint = searchQuery.trim()
        ? `/api/gifs?q=${encodeURIComponent(searchQuery)}&page=${nextPage}&limit=12`
        : `/api/gifs?page=${nextPage}&limit=12`

      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`Failed to fetch more GIFs: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const newGifs = data.data || []
        setGifs((prev) => [...prev, ...newGifs])
        setHasMore(newGifs.length >= 12)
        setPage(nextPage)
      } else {
        throw new Error(data.message || "Failed to fetch more GIFs")
      }
    } catch (err) {
      console.error("Error loading more GIFs:", err)
      // Don't set error state for pagination issues
    } finally {
      setLoading(false)
    }
  }

  // Handle scroll for infinite loading
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (container.scrollHeight - container.scrollTop <= container.clientHeight * 1.5 && !loading && hasMore) {
        loadMoreGifs()
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [loading, hasMore, page, searchQuery])

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

      {showAiSuggestions && aiSuggestedGifs.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Reply GIFs</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAiSuggestions(false)} className="h-6 w-6 p-0">
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {aiSuggestedGifs.slice(0, 4).map((gif) => (
              <div
                key={gif.id || gif._id}
                className="gif-item cursor-pointer rounded overflow-hidden hover:opacity-80 transition-opacity"
                onClick={() =>
                  onGifSelect(
                    gif.clipLink || gif.url,
                    gif.clipThumbnailUrl || gif.preview,
                    gif.mood || (gif.moods && gif.moods[0]),
                  )
                }
              >
                <img
                  src={gif.clipThumbnailUrl || gif.preview}
                  alt={gif.title || "GIF"}
                  className="w-full h-16 object-cover"
                />
                {(gif.mood || (gif.moods && gif.moods[0])) && (
                  <div className="bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                    {gif.mood || gif.moods[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && page === 1 ? (
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
        <div ref={containerRef} className="grid grid-cols-4 gap-2 max-h-[25vh] overflow-y-auto">
          {gifs.map((gif) => (
            <div
              key={gif.id || gif._id}
              className="gif-item cursor-pointer rounded overflow-hidden hover:opacity-80 transition-opacity"
              onClick={() =>
                onGifSelect(
                  gif.url || gif.clipLink,
                  gif.preview || gif.clipThumbnailUrl,
                  (gif.moods && gif.moods[0]) || gif.mood,
                )
              }
            >
              <img
                src={gif.preview || gif.clipThumbnailUrl}
                alt={gif.title || "GIF"}
                className="w-full h-16 object-cover"
              />
              {((gif.moods && gif.moods[0]) || gif.mood) && (
                <div className="bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
                  {(gif.moods && gif.moods[0]) || gif.mood}
                </div>
              )}
            </div>
          ))}
          {loading && page > 1 && (
            <div className="col-span-4 flex justify-center p-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ApiGifPicker
