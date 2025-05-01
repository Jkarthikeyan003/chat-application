import type { ObjectId } from "mongodb"

export interface Conversation {
  _id?: string | ObjectId
  members: string[] // Array of user IDs who are part of this conversation
  lastMessage?: string
  lastMessageAt?: Date
  lastMessageSenderId?: string
  unreadCount?: number
  createdAt: Date
  updatedAt: Date
}

export function createConversation(data: Partial<Conversation>): Conversation {
  const now = new Date()

  return {
    members: data.members || [],
    lastMessage: data.lastMessage,
    lastMessageAt: data.lastMessageAt,
    lastMessageSenderId: data.lastMessageSenderId,
    unreadCount: data.unreadCount || 0,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
}
