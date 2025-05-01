import { format } from "date-fns"
import Image from "next/image"

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

interface MessageBubbleProps {
  message: Message
  isUser: boolean
}

export function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.timestamp), "h:mm a")

  const renderContent = () => {
    switch (message.type) {
      case "image":
        return (
          <div className="relative rounded-lg overflow-hidden mb-1">
            <Image
              src={message.content || "/placeholder.svg?height=200&width=300&query=image"}
              alt="Image"
              width={300}
              height={200}
              className="max-w-full rounded-lg"
            />
          </div>
        )
      case "gif":
        return (
          <div className="relative rounded-lg overflow-hidden mb-1">
            <Image
              src={message.content || "/placeholder.svg?height=200&width=300&query=gif"}
              alt="GIF"
              width={300}
              height={200}
              className="max-w-full rounded-lg"
            />
            {message.gifMood && message.gifMood.length > 0 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {message.gifMood.join(", ")}
              </div>
            )}
          </div>
        )
      default:
        return <p className="mb-1">{message.text}</p>
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          isUser ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
        }`}
      >
        {renderContent()}
        <div className={`text-xs ${isUser ? "text-blue-200" : "text-gray-500"} text-right`}>{formattedTime}</div>
      </div>
    </div>
  )
}
