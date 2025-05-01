"use client"

import { useState, useEffect } from "react"
import ConversationItem from "./conversation-item"
import { Skeleton } from "@/components/ui/skeleton"
import type { Conversation } from "./conversation-item"

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Add authorization header with token
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        // Try to get token from localStorage
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("token")
          if (token) {
            headers.Authorization = `Bearer ${token}`
          }
        }

        const response = await fetch("/api/conversations?skipMock=true", { headers })

        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`)
        }

        const data = await response.json()

        // Check if data has the expected structure
        if (!data.success) {
          throw new Error(data.message || "API returned unsuccessful response")
        }

        // Check if data.data exists and is an array
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error("Invalid data structure received from API")
        }

        // Transform the data to match the UI model
        const uiConversations = data.data.map((conv: any) => {
          // Get the first other user if available
          const otherUser = conv.otherUsers && conv.otherUsers.length > 0 ? conv.otherUsers[0] : null

          return {
            _id: conv._id.toString(),
            name: otherUser?.name || otherUser?.username || "Unknown User",
            avatar: otherUser?.avatar || undefined,
            lastMessage: conv.lastMessage || "",
            timestamp: new Date(conv.lastMessageAt || conv.updatedAt || conv.createdAt),
            unread: conv.unread || 0,
          }
        })

        setConversations(uiConversations)
      } catch (err) {
        console.error("Error fetching conversations:", err)
        setError(err instanceof Error ? err.message : "Failed to load conversations")
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h3 className="font-medium mb-2">Error loading conversations</h3>
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center p-4">
            <Skeleton className="h-12 w-12 rounded-full mr-4" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 rounded-lg overflow-hidden">
      {conversations.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No conversations yet</div>
      ) : (
        conversations.map((conversation) => <ConversationItem key={conversation._id} conversation={conversation} />)
      )}
    </div>
  )
}
