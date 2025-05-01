"use client"

import { useState, useEffect, useRef } from "react"
import { MessageBubble } from "./message-bubble"
import { MessageInput } from "./message-input"
import { Skeleton } from "@/components/ui/skeleton"
import { browserDebug } from "@/lib/debug-utils"

interface Message {
  id: string
  sender: "user" | "other"
  text: string
  timestamp: Date
  type?: "text" | "image" | "gif"
  content?: string
  thumbnailUrl?: string
  gifMood?: string[]
}

interface ChatInterfaceProps {
  conversationId: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }

        browserDebug("Fetching messages", { conversationId, headers })

        const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
          headers,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`)
        }

        const data = await response.json()
        browserDebug("Messages response", data)

        if (!data.success || !data.data) {
          throw new Error("Invalid response format")
        }

        // Transform messages for UI
        const transformedMessages = data.data.map((msg: any) => ({
          id: msg._id,
          sender: msg.sender === localStorage.getItem("userId") ? "user" : "other",
          text: msg.text,
          timestamp: new Date(msg.timestamp || msg.createdAt),
          type: msg.type || "text",
          content: msg.content,
          thumbnailUrl: msg.thumbnailUrl,
          gifMood: msg.gifMood,
        }))

        setMessages(transformedMessages)
      } catch (err) {
        console.error("Error fetching messages:", err)
        setError(err instanceof Error ? err.message : "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [conversationId])

  const handleSendMessage = async (
    text: string,
    type: "text" | "image" | "gif" = "text",
    content?: string,
    gifMood?: string[],
  ) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User ID not found")
      }

      // Optimistically add message to UI
      const newMessage: Message = {
        id: Date.now().toString(), // Temporary ID
        sender: "user",
        text,
        timestamp: new Date(),
        type,
        content,
        gifMood,
      }

      setMessages((prev) => [...prev, newMessage])

      // Send message to API
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          text,
          type,
          content,
          gifMood,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }

      const data = await response.json()
      browserDebug("Send message response", data)

      if (!data.success) {
        throw new Error(data.message || "Failed to send message")
      }

      // Update the message with the real ID from the server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                id: data.data._id,
              }
            : msg,
        ),
      )
    } catch (err) {
      console.error("Error sending message:", err)
      // Remove the optimistically added message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== Date.now().toString()))
      // Show error to user
      alert(err instanceof Error ? err.message : "Failed to send message")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[70%] ${i % 2 === 0 ? "mr-auto" : "ml-auto"}`}>
              <Skeleton className={`h-16 rounded-lg ${i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-center p-6 max-w-md">
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading messages</h3>
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
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start the conversation by sending a message below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} isUser={message.sender === "user"} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
