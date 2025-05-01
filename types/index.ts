import type { ObjectId } from "mongodb"

// Database model types
export interface ConversationModel {
  _id?: string | ObjectId
  members: string[]
  lastMessage?: string
  lastMessageAt?: Date
  lastMessageSenderId?: string
  unreadCount?: number
  createdAt: Date
  updatedAt: Date
}

// UI-specific types
export interface ConversationUI {
  _id: string
  id?: string // For backward compatibility
  name: string
  avatar?: string
  members: string[]
  lastMessage?: string
  timestamp: Date
  unread: number
}

export interface MessageModel {
  _id?: string | ObjectId
  conversationId: string | ObjectId
  sender: string
  text: string
  timestamp: Date
  type?: "text" | "image" | "gif"
  content?: string
  thumbnailUrl?: string
  gifMood?: string[]
  read?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MessageUI {
  id: string
  _id?: string | ObjectId
  conversationId?: string
  sender: "user" | "other"
  text: string
  timestamp: Date
  type?: "text" | "image" | "gif"
  content?: string
  thumbnailUrl?: string
  gifMood?: string[]
  read?: boolean
}

export interface UserModel {
  _id?: string | ObjectId
  username: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserUI {
  id: string
  _id?: string | ObjectId
  username: string
  name: string
  avatar?: string
}
