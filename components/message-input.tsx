"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, X, Loader2, Plus } from "lucide-react"
import { ApiGifPicker } from "./api-gif-picker"

interface MessageInputProps {
  onSendMessage: (text: string, gifUrl?: string, replyToId?: string, gifMood?: string) => void
  isLoading?: boolean
  messageContext?: {
    id?: string
    content?: string
    type?: "text" | "gif"
    gifMood?: string
  } | null
  onCancelReply?: () => void
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  messageContext = null,
  onCancelReply,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [selectedGifThumbnail, setSelectedGifThumbnail] = useState<string | null>(null)
  const [selectedGifMood, setSelectedGifMood] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when component mounts or when replying
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [messageContext])

  const handleSendMessage = () => {
    if (message.trim() || selectedGif) {
      onSendMessage(message, selectedGif || undefined, messageContext?.id, selectedGifMood || undefined)
      setMessage("")
      setSelectedGif(null)
      setSelectedGifThumbnail(null)
      setSelectedGifMood(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleGifSelect = (gifUrl: string, thumbnailUrl: string, mood?: string) => {
    setSelectedGif(gifUrl)
    setSelectedGifThumbnail(thumbnailUrl)
    setSelectedGifMood(mood || null)
    setShowGifPicker(false)
  }

  return (
    <div className="message-input-container p-3 border-t bg-white relative">
      {/* GIF Picker positioned above the message bar */}
      {showGifPicker && (
        <div className="gif-picker-container absolute bottom-full left-0 right-0 mb-2 z-10 bg-white rounded-lg shadow-lg border border-gray-200">
          <ApiGifPicker
            onGifSelect={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
            messageContext={messageContext}
          />
        </div>
      )}

      {messageContext && onCancelReply && (
        <div className="reply-preview flex items-center bg-gray-100 p-2 rounded mb-2">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-gray-500">Replying to {messageContext.type === "gif" ? "GIF" : "message"}</p>
            <p className="text-sm truncate">
              {messageContext.type === "gif"
                ? "GIF: " + (messageContext.gifMood || "Unknown mood")
                : messageContext.content}
            </p>
          </div>
          <button onClick={onCancelReply} className="ml-2 p-1 hover:bg-gray-200 rounded-full" aria-label="Cancel reply">
            <X size={16} />
          </button>
        </div>
      )}

      {selectedGif && (
        <div className="selected-gif-preview mb-2 relative">
          <div className="aspect-video w-20 bg-gray-100 rounded overflow-hidden">
            <img src={selectedGifThumbnail || selectedGif} alt="Selected GIF" className="w-full h-full object-cover" />
            {selectedGifMood && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                {selectedGifMood}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedGif(null)
              setSelectedGifThumbnail(null)
              setSelectedGifMood(null)
            }}
            className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5"
            aria-label="Remove GIF"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setShowGifPicker(!showGifPicker)}
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add GIF</span>
          </Button>
        </div>

        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1"
        />

        <Button
          onClick={handleSendMessage}
          disabled={isLoading || (!message.trim() && !selectedGif)}
          size="icon"
          className="shrink-0 bg-blue-600 hover:bg-blue-700"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={20} />}
        </Button>
      </div>
    </div>
  )
}
