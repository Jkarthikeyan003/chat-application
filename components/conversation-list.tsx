"use client"

import { useState, useEffect } from "react"
import ConversationItem from "./conversation-item"
import { Skeleton } from "@/components/ui/skeleton"
import type { Conversation } from "./conversation-item"
import { toConversationUI } from "@/utils/type-converters"
import { browserDebug } from "@/lib/debug-utils"

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Add authorization header with test token
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (process.env.TEST_TOKEN) {
          headers.Authorization = `Bearer ${process.env.TEST_TOKEN}`
        } else {
          // Try to get token from localStorage
          if (typeof window !== "undefined") {
            const token = localStorage.getItem("token")
            if (token) {
              headers.Authorization = `Bearer ${token}`
            }
          }
        }

        browserDebug("Fetching conversations with headers", headers)

        const response = await fetch("/api/conversations", { headers })
        browserDebug("API Response status", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          browserDebug("API Error response", errorText)
          throw new Error(`Failed to fetch conversations: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        browserDebug("API Response data", data)

        // Check if data has the expected structure
        if (!data.success) {
          throw new Error(data.message || "API returned unsuccessful response")
        }

        // Check if data.data exists and is an array
        if (!data.data || !Array.isArray(data.data)) {
          browserDebug("Invalid data structure", data)
          throw new Error("Invalid data structure received from API")
        }

        // Transform the data to match the UI model
        const uiConversations = data.data.map((conv: any) => {
          // Get the first other user if available
          const otherUser = conv.otherUsers && conv.otherUsers.length > 0 ? conv.otherUsers[0] : null

          return toConversationUI(
            conv,
            otherUser?.name || otherUser?.username || "Unknown User",
            otherUser?.avatar,
            otherUser?.username,
          )
        })

        browserDebug("Transformed conversations", uiConversations)
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
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-600"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading conversations</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => window.location.reload()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
            <path d="M3 22v-6h6"></path>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
          Try Again
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
    <div className="divide-y divide-gray-100">
      {conversations.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-4">Start a new conversation to begin chatting</p>
        </div>
      ) : (
        conversations.map((conversation) => <ConversationItem key={conversation._id} conversation={conversation} />)
      )}
    </div>
  )
}
