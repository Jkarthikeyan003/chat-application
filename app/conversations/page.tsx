import ConversationList from "@/components/conversation-list"
import { LogoutButton } from "@/components/logout-button"

export default function ConversationsPage() {
  return (
    <main className="container mx-auto py-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <LogoutButton />
      </div>
      <div className="bg-white rounded-lg shadow">
        <ConversationList />
      </div>
    </main>
  )
}
