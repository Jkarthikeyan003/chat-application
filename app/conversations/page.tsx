"use client"

import { useRouter } from "next/navigation"
import ConversationList from "@/components/conversation-list"
import { Button } from "@/components/ui/button"
import { PlusCircle, LogOut } from "lucide-react"

export default function ConversationsPage() {
  const router = useRouter()

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

  const handleNewChat = () => {
    // This would typically create a new conversation and redirect
    // For now, just redirect to the conversations page
    alert("This feature is coming soon!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 h-screen flex flex-col">
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-600 rounded-full p-2">
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
                    className="text-white"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h1 className="ml-3 text-2xl font-bold text-gray-800">Conversations</h1>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNewChat}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button variant="outline" className="border-gray-300" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList />
          </div>
        </div>
      </div>
    </div>
  )
}
