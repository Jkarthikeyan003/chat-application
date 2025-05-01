"use client"

import type React from "react"

import { useState, useEffect } from "react"

export default function DebugMessageSender() {
  const [senderId, setSenderId] = useState("user")
  const [receiverId, setReceiverId] = useState("other")
  const [message, setMessage] = useState("")
  const [conversationId, setConversationId] = useState("")
  const [isGif, setIsGif] = useState(false)
  const [gifUrl, setGifUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [dbStatusLoading, setDbStatusLoading] = useState(false)

  // Get token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token") || ""
    setToken(storedToken)
  }, [])

  const checkDbStatus = async () => {
    try {
      setDbStatusLoading(true)
      setError(null)

      const response = await fetch("/api/debug/mongodb")
      const data = await response.json()

      setDbStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check database status")
    } finally {
      setDbStatusLoading(false)
    }
  }

  const createTestMessage = async () => {
    try {
      setDbStatusLoading(true)
      setError(null)

      const response = await fetch("/api/debug/mongodb", {
        method: "POST",
      })
      const data = await response.json()

      setDbStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test message")
    } finally {
      setDbStatusLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload: any = {
        senderId,
        receiverId,
        members: [senderId, receiverId],
      }

      // Add message if not a GIF or if it's both
      if (!isGif || message) {
        payload.message = message
      }

      // Add conversation ID if provided
      if (conversationId) {
        payload.conversationId = conversationId
      }

      // Add GIF data if it's a GIF message
      if (isGif && gifUrl) {
        payload.clipLink = gifUrl
        payload.clipThumbnailUrl = thumbnailUrl || gifUrl
      }

      console.log("Sending message payload:", payload)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Add token if available
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResult(data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message")
      }

      // Clear form on success
      if (data.success) {
        setMessage("")
        if (isGif) {
          setGifUrl("")
          setThumbnailUrl("")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4">Debug Message Sender</h2>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Database Status</h3>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={checkDbStatus}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={dbStatusLoading}
          >
            {dbStatusLoading ? "Checking..." : "Check DB Status"}
          </button>
          <button
            onClick={createTestMessage}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={dbStatusLoading}
          >
            {dbStatusLoading ? "Creating..." : "Create Test Message"}
          </button>
        </div>

        {dbStatus && (
          <div className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
            <pre>{JSON.stringify(dbStatus, null, 2)}</pre>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sender ID</label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Receiver ID</label>
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Conversation ID (optional)</label>
          <input
            type="text"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Leave empty to create new conversation"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            <input type="checkbox" checked={isGif} onChange={(e) => setIsGif(e.target.checked)} className="mr-2" />
            Send as GIF
          </label>
        </div>

        {isGif ? (
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">GIF URL</label>
              <input
                type="text"
                value={gifUrl}
                onChange={(e) => setGifUrl(e.target.value)}
                className="w-full p-2 border rounded"
                required={isGif}
                placeholder="https://example.com/gif.gif"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail URL (optional)</label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message Text (optional for GIFs)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Optional message text to accompany GIF"
              />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              required={!isGif}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Auth Token</label>
          <textarea
            value={token || ""}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border rounded text-xs font-mono"
            rows={2}
            placeholder="JWT token (optional)"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || (isGif && !gifUrl)}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Result:</h3>
          <div className="p-2 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
