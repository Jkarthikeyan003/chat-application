import { NextResponse } from "next/server"

export async function GET(request) {
  // List all available API endpoints
  const endpoints = [
    {
      path: "/api/conversations",
      methods: ["GET"],
      description: "Get all conversations for a user",
      params: ["userId"],
    },
    {
      path: "/api/conversations/[id]",
      methods: ["GET"],
      description: "Get a specific conversation by ID",
      params: [],
    },
    {
      path: "/api/messages/list",
      methods: ["GET"],
      description: "List messages for a conversation",
      params: ["conversationId", "page", "limit", "userId"],
    },
    {
      path: "/api/messages/send",
      methods: ["POST"],
      description: "Send a new message",
      body: {
        senderId: "string (required)",
        receiverId: "string (required)",
        message: "string (required for text messages)",
        conversationId: "string (optional)",
        members: "array (optional)",
        clipLink: "string (required for GIF messages)",
        clipThumbnailUrl: "string (optional for GIF messages)",
      },
    },
    {
      path: "/api/chat",
      methods: ["GET"],
      description: "Alternative endpoint for getting conversations",
      params: ["userId"],
    },
    {
      path: "/api/chat/[id]",
      methods: ["GET"],
      description: "Alternative endpoint for getting a specific conversation",
      params: [],
    },
    {
      path: "/api/chat/messages",
      methods: ["GET"],
      description: "Alternative endpoint for listing messages",
      params: ["conversationId", "page", "limit", "userId"],
    },
    {
      path: "/api/chat/messages/send",
      methods: ["POST"],
      description: "Alternative endpoint for sending messages",
      body: "Same as /api/messages/send",
    },
  ]

  return NextResponse.json({
    success: true,
    message: "Available API endpoints",
    data: {
      endpoints,
      note: "This is a debug endpoint to help diagnose API issues",
    },
  })
}
