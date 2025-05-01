"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { MessageInput } from "./message-input"

interface Message {
  id: string
  text?: string
  gifUrl?: string
  sender: string
  timestamp: Date | string
  isCurrentUser: boolean
  gifMood?: string
}

interface ChatInterfaceProps {
  conversationId: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<any>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Get current user ID from localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId")
    if (userId) {
      setCurrentUserId(userId)
    }
  }, [])

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get token from localStorage
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch messages")
      }

      console.log("Fetched messages:", data.data.length)

      // Get current user ID
      const userId = localStorage.getItem("userId")

      // Transform messages for UI
      const transformedMessages = data.data.map((msg: any) => ({
        id: msg._id,
        text: msg.text || msg.message,
        gifUrl: msg.clipLink || msg.gifUrl,
        sender: msg.senderId || msg.sender,
        timestamp: new Date(msg.timestamp || msg.createdAt),
        isCurrentUser: (msg.senderId || msg.sender) === userId,
        gifMood: msg.gifMood,
      }))

      setMessages(transformedMessages)
    } catch (err) {
      console.error("Error fetching messages:", err)
      setError(err instanceof Error ? err.message : "Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (conversationId) {
      fetchMessages()
    }
  }, [conversationId])

  const handleSendMessage = async (text: string, gifUrl?: string, replyToId?: string, gifMood?: string) => {
    try {
      // Get token and user ID from localStorage
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        throw new Error("Authentication information not found")
      }

      // Get user info
      const userJson = localStorage.getItem("user")
      const user = userJson ? JSON.parse(userJson) : null

      if (!user) {
        throw new Error("User information not found")
      }

      // Optimistically add message to UI
      const tempId = `temp-${Date.now()}`
      const newMessage: Message = {
        id: tempId,
        text: text,
        gifUrl: gifUrl,
        sender: userId,
        timestamp: new Date(),
        isCurrentUser: true,
        gifMood: gifMood,
      }

      setMessages((prev) => [...prev, newMessage])

      // Prepare message data
      const messageData = {
        conversationId,
        message: text,
        clipLink: gifUrl,
        clipThumbnailUrl: gifUrl, // Using the same URL for both
        gifMood: gifMood,
      }

      console.log("Sending message:", messageData)

      // Send message to API
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to send message")
      }

      console.log("Message sent successfully:", data.data)

      // Update the temporary message with the real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                id: data.data._id,
              }
            : msg,
        ),
      )

      // Clear reply context
      setReplyingTo(null)
    } catch (err) {
      console.error("Error sending message:", err)

      // Remove the optimistically added message
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")))

      // Show error to user
      alert(err instanceof Error ? err.message : "Failed to send message")
    }
  }

  const handleReply = (message: any) => {
    setReplyingTo({
      id: message.id,
      content: message.text,
      type: message.gifUrl ? "gif" : "text",
      gifMood: message.gifMood,
    })
  }

  return (
    <div className="chat-interface flex flex-col h-full">
      <div className="messages-container flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} onReply={() => handleReply(message)} />
          ))
        )}
        {isLoading && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
        {error && (
          <div className="text-center p-4 text-red-500">
            <p>Error: {error}</p>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => fetchMessages()}
            >
              Retry
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        messageContext={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  )
}
