"use client"

import { format } from "date-fns"
import { Reply } from "lucide-react"

interface MessageProps {
  message: {
    id: string
    text?: string
    gifUrl?: string
    sender: string
    timestamp: Date | string
    isCurrentUser: boolean
    gifMood?: string
  }
  onReply: () => void
}

export function MessageBubble({ message, onReply }: MessageProps) {
  const formattedTime =
    typeof message.timestamp === "string"
      ? format(new Date(message.timestamp), "h:mm a")
      : format(message.timestamp, "h:mm a")

  const isGif = !!message.gifUrl

  return (
    <div className={`flex mb-4 ${message.isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[70%] ${
          message.isCurrentUser
            ? "bg-blue-600 text-white rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-lg"
            : "bg-gray-100 text-gray-800 rounded-tl-none rounded-tr-lg rounded-bl-lg rounded-br-lg"
        }`}
      >
        {isGif ? (
          <div className="overflow-hidden">
            <img
              src={message.gifUrl || "/placeholder.svg"}
              alt="GIF"
              className="w-full h-auto rounded-t-lg"
              onError={(e) => {
                e.currentTarget.src = "/gif-error.png"
              }}
            />
            {message.text && <div className="p-3">{message.text}</div>}
          </div>
        ) : (
          <div className="p-3">{message.text}</div>
        )}

        <div className="flex items-center justify-between px-3 pb-1">
          <button
            onClick={onReply}
            className={`text-xs mr-2 opacity-50 hover:opacity-100 ${
              message.isCurrentUser ? "text-white" : "text-gray-600"
            }`}
          >
            <Reply size={14} />
          </button>
          <span className={`text-xs ${message.isCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  )
}
