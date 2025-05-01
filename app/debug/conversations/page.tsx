"use client"

import { useState, useEffect } from "react"
import { browserDebug } from "@/lib/debug-utils"

export default function ConversationsDebugPage() {
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState("")

  useEffect(() => {
    // Try to get token from localStorage
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        setToken(storedToken)
      }
    }
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Add authorization header with token
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      browserDebug("Fetching conversations with headers", headers)

      const response = await fetch("/api/conversations", { headers })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch conversations: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      setApiResponse(data)
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError(err instanceof Error ? err.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Conversations API Debug</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Authentication Token</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Enter JWT token"
          />
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("token", token)
                alert("Token saved to localStorage")
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save Token
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch Conversations"}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded">
          <h3 className="font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {apiResponse && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">API Response</h2>
          <div className="bg-gray-50 p-4 rounded border overflow-auto max-h-[500px]">
            <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
