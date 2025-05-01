"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, ArrowLeft, LogOut } from "lucide-react"

interface ChatHeaderProps {
  conversationId: string
  onBack: () => void
  onRefresh: () => void
}

interface Conversation {
  _id: string
  members: string[]
  otherUsers?: any[]
}

export function ChatHeader({ conversationId, onBack, onRefresh }: ChatHeaderProps) {
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchConversation = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get token from localStorage
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setConversation(data.data)
      } else {
        throw new Error(data.message || "Failed to fetch conversation")
      }
    } catch (err) {
      console.error("Error fetching conversation:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Get current user from localStorage
    const userJson = localStorage.getItem("user")
    const user = userJson ? JSON.parse(userJson) : null
    setCurrentUser(user)

    if (conversationId) {
      fetchConversation()
    }
  }, [conversationId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchConversation()
    // Also trigger the parent's refresh function to reload messages
    onRefresh()
  }

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userId")

    // Clear token cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict"

    // Redirect to login page without alert
    router.push("/")
  }

  const getOtherMemberName = () => {
    if (!conversation || !currentUser) return "Loading..."

    // Find the other user in the conversation
    const otherUser = conversation.otherUsers && conversation.otherUsers.length > 0 ? conversation.otherUsers[0] : null

    // Return username if available, otherwise return the member ID
    return otherUser?.username || otherUser?.name || "Unknown"
  }

  if (loading && !refreshing) {
    return (
      <div className="chat-header border-b border-gray-200 bg-white p-4 flex items-center">
        <button onClick={onBack} className="btn btn-rounded btn-icon mr-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold">Loading...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="chat-header border-b border-gray-200 bg-white p-4 flex items-center">
        <button onClick={onBack} className="btn btn-rounded btn-icon mr-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-red-500">Error: {error}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-header border-b border-gray-200 bg-white p-4 flex items-center justify-between">
      <button onClick={onBack} className="btn btn-rounded btn-icon mr-2">
        <ArrowLeft size={20} />
      </button>

      <div className="avatar mr-3 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
        <span>{getOtherMemberName().substring(0, 2).toUpperCase()}</span>
      </div>

      <div className="flex-1">
        <h2 className="font-bold">{getOtherMemberName()}</h2>
        <p className="text-sm text-gray-500">Online</p>
      </div>

      <button
        onClick={handleRefresh}
        className="btn btn-primary mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        disabled={refreshing}
      >
        <RefreshCw size={16} className={`mr-1 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>

      <button
        className="btn btn-rounded btn-danger tooltip p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
        data-tooltip="Logout"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  )
}
