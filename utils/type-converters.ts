import type { Conversation } from "@/components/conversation-item"

export function toConversationUI(conversation: any, otherUserName: string, otherUserAvatar?: string): Conversation {
  // Parse the timestamp if it's a string
  let timestamp = conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt
  if (typeof timestamp === "string") {
    timestamp = new Date(timestamp)
  } else if (!(timestamp instanceof Date)) {
    timestamp = new Date()
  }

  return {
    _id: conversation._id.toString(),
    name: otherUserName,
    avatar: otherUserAvatar || "/abstract-geometric-shapes.png",
    lastMessage: conversation.lastMessage || "",
    timestamp: timestamp,
    unread: conversation.unread || 0,
  }
}
