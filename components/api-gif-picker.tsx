import type React from "react"
;('"use client')

import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Gif {
  id: string
  url: string
  title: string
  preview: string
  moods?: string[]
}

interface ApiGifPickerProps {
  onSelect: (url: string, moods?: string[]) => void
  onClose?: () => void
  messageContext?: any
}

export function ApiGifPicker({ onSelect, onClose, messageContext }: ApiGifPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [gifs, setGifs] = useState<Gif[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGifs = async (query?: string) => {
    try {
      setLoading(true)
      setError(null)

      let url = "/api/gifs"
      if (query) {
        url += `?q=${encodeURIComponent(query)}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch GIFs: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch GIFs")
      }

      setGifs(data.data)
    } catch (err) {
      console.error("Error fetching GIFs:", err)
      setError(err instanceof Error ? err.message : "Failed to load GIFs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGifs()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchGifs(searchTerm)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    fetchGifs()
  }

  const handleGifSelect = (gif: Gif) => {
    onSelect(gif.url, gif.moods)
    onClose?.()
  }

  return (
    <div className="p-3">
      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button type="submit" size="sm">
          <Search className="h-4 w-4 mr-1" />
          Search
        </Button>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-md" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchGifs(searchTerm)}>
            Try Again
          </Button>
        </div>
      ) : gifs.length === 0 ? (
        <div className="text-center p-4 text-gray-500">No GIFs found</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {gifs.map((gif) => (
            <div
              key={gif.id}
              className="cursor-pointer rounded-md overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => handleGifSelect(gif)}
            >
              <Image
                src={gif.preview || gif.url}
                alt={gif.title}
                width={200}
                height={150}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ApiGifPicker
