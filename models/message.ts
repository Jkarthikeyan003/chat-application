import type { ObjectId } from "mongodb"

export interface Message {
  _id?: string | ObjectId
  conversationId: string
  senderId: string
  receiverId: string
  message: string
  members: string[] // Array of user IDs who are part of this conversation
  clipThumbnailUrl?: string // Optional thumbnail URL for media
  clipLink?: string // Optional link to media
  read: boolean
  createdAt: Date
  updatedAt: Date
}

export function createMessage(data: Partial<Message>): Message {
  const now = new Date()

  return {
    conversationId: data.conversationId || "",
    senderId: data.senderId || "",
    receiverId: data.receiverId || "",
    message: data.message || "",
    members: data.members || [],
    clipThumbnailUrl: data.clipThumbnailUrl,
    clipLink: data.clipLink,
    read: data.read !== undefined ? data.read : false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
}


export interface MediaQueryParams {
  search?: string
  movieName?: string
  artist?: string
  characterNames?: string
  mood?: string
  transcript?: string
  property?: string
  place?: string
}