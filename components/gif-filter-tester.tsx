"use client"

import type React from "react"
import { useState, useEffect } from "react"

export default function GifFilterTester() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [mood, setMood] = useState<string>("")
  const [messageText, setMessageText] = useState<string>("")
  const [limit, setLimit] = useState<number>(10)
  const [conversationId, setConversationId] = useState<string>("")
  const [senderId, setSenderId] = useState<string>("")
  const [receiverId, setReceiverId] = useState<string>("")
  const [token, setToken] = useState<string | null>(null)
  const [selectedGif, setSelectedGif] = useState<any>(null)

  // Get token on component mount
  useEffect(() => {
    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token") || ""
      setToken(storedToken)

      // Get current user from localStorage
      const userJson = localStorage.getItem("user")
      const user = userJson ? JSON.parse(userJson) : null
      if (user) {
        setSenderId(user.username)
      }
    }
  }, []) // Empty dependency array to run only once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedGif(null)

    try {
      const payload = {
        mood: mood || undefined,
        messageText: messageText || undefined,
        limit,
        conversationId: conversationId || undefined,
        senderId: senderId || undefined,
        receiverId: receiverId || undefined,
      }

      console.log("Sending GIF filter request:", payload)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add token if available
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch("/api/gifs/filter", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResult(data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to filter GIFs")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter GIFs")
    } finally {
      setLoading(false)
    }
  }

  const handleGifSelect = (gif: any) => {
    setSelectedGif(gif)
  }

  const predefinedMoods = [
    "Happy",
    "Sad",
    "Angry",
    "Surprised",
    "Excited",
    "Frustrated",
    "Confused",
    "Bored",
    "Nervous",
    "Calm",
  ]

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">GIF Filter API Tester</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mood</label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. Happy, Sad, Angry"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {predefinedMoods.map((predefinedMood) => (
                <button
                  key={predefinedMood}
                  type="button"
                  className={`text-xs px-2 py-1 rounded ${
                    mood === predefinedMood ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setMood(predefinedMood)}
                >
                  {predefinedMood}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message Text</label>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter message text to analyze"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number.parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              min="1"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Conversation ID</label>
            <input
              type="text"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sender ID</label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Receiver ID</label>
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Auth Token</label>
            <input
              type="text"
              value={token || ""}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2 border rounded text-xs font-mono"
              placeholder="JWT token (optional)"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || (!mood && !messageText)}
        >
          {loading ? "Filtering GIFs..." : "Filter GIFs"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && result.success && result.data && result.data.gifs && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Found {result.data.count} GIFs:</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {result.data.gifs.map((gif: any, index: number) => (
              <div
                key={gif._id || index}
                className={`border rounded overflow-hidden cursor-pointer ${
                  selectedGif === gif ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleGifSelect(gif)}
              >
                <div className="relative aspect-video">
                  <img
                    src={gif.clipThumbnailUrl || "/placeholder.svg"}
                    alt={gif.transcript || `GIF ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1">
                    {gif.clipDuration || "0:00"}
                  </div>
                </div>
                <div className="p-1 text-xs truncate">{gif.transcript || gif.movieName || "Unknown"}</div>
              </div>
            ))}
          </div>

          {selectedGif && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h4 className="font-semibold mb-2">Selected GIF Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="aspect-video bg-black rounded overflow-hidden">
                    <img
                      src={selectedGif.clipThumbnailUrl || "/placeholder.svg"}
                      alt={selectedGif.transcript || "Selected GIF"}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="text-sm">
                  <p>
                    <strong>Movie:</strong> {selectedGif.movieName || "Unknown"}
                  </p>
                  <p>
                    <strong>Transcript:</strong> {selectedGif.transcript || "None"}
                  </p>
                  <p>
                    <strong>Mood:</strong> {selectedGif.mood || "Unknown"}
                  </p>
                  <p>
                    <strong>Artists:</strong> {selectedGif.artist || "Unknown"}
                  </p>
                  <p>
                    <strong>Place:</strong> {selectedGif.place || "Unknown"}
                  </p>
                  <div className="mt-2">
                    <a
                      href={selectedGif.clipLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open GIF in new tab
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {result && !result.success && (
        <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          <strong>API Response:</strong> {result.message}
        </div>
      )}
    </div>
  )
}
