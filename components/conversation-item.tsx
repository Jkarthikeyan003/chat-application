"use client"

import { useRouter } from "next/navigation"
import { format, isToday, isYesterday } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define the conversation type directly in this file
export interface Conversation {
  _id: string
  name: string
  avatar?: string
  lastMessage?: string
  timestamp: Date
  unread: number
}

interface ConversationItemProps {
  conversation: Conversation
}

export default function ConversationItem({ conversation }: ConversationItemProps) {
  const router = useRouter()

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MM/dd/yyyy")
    }
  }

  const handleClick = () => {
    router.push(`/chat/${conversation._id}`)
  }

  return (
    <div className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={handleClick}>
      <Avatar className="h-12 w-12 mr-4">
        <AvatarImage
          src={conversation.avatar || "/placeholder.svg?height=48&width=48&query=user"}
          alt={conversation.name}
        />
        <AvatarFallback>{conversation.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-medium text-slate-900 truncate">{conversation.name}</h3>
          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
            {formatTimestamp(conversation.timestamp)}
          </span>
        </div>

        <p className="text-sm text-slate-500 truncate">{conversation.lastMessage || "No messages yet"}</p>
      </div>

      {conversation.unread > 0 && (
        <div className="ml-2 bg-blue-600 text-white text-xs font-medium rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
          {conversation.unread}
        </div>
      )}
    </div>
  )
}
