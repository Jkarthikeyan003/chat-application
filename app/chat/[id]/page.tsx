import { Suspense } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { ChatHeader } from "@/components/chat-header"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatPageProps {
  params: {
    id: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = params

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Suspense fallback={<SkeletonHeader />}>
        <ChatHeader conversationId={id} />
      </Suspense>
      <div className="flex-1 overflow-hidden">
        <ChatInterface conversationId={id} />
      </div>
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="border-b border-gray-200 bg-white p-4 flex items-center">
      <Skeleton className="h-10 w-10 rounded-full mr-3" />
      <div>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}
