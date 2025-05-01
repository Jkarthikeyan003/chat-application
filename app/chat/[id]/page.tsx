"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatHeader } from "@/components/chat-header"
import { ChatInterface } from "@/components/chat-interface"

interface ChatPageProps {
  params: {
    id: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = params
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }
    setIsAuthenticated(true)
  }, [router])

  if (isAuthenticated === null) {
    return <ChatSkeleton />
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white">
      <ChatHeader
        conversationId={id}
        onBack={() => router.push("/conversations")}
        onRefresh={() => window.location.reload()}
      />
      <div className="flex-1 overflow-hidden">
        <ChatInterface conversationId={id} />
      </div>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="border-b p-4 flex items-center bg-white">
        <Skeleton className="h-10 w-10 rounded-full mr-3" />
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[70%] ${i % 2 === 0 ? "mr-auto" : "ml-auto"}`}>
              <Skeleton className={`h-16 rounded-lg ${i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4 bg-white">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  )
}
