import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/token-utils"

export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized: No token provided" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    let userId

    try {
      // Verify the token
      const decoded = await verifyToken(token)
      userId = decoded.userId
      console.log("Token verified for user:", userId)
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ success: false, message: "Unauthorized: Invalid token" }, { status: 401 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()
    console.log("Connected to MongoDB")

    // Find conversations where the user is a member
    const conversations = await db
      .collection("conversations")
      .find({ members: userId })
      .sort({ updatedAt: -1 })
      .toArray()

    console.log(`Found ${conversations.length} conversations for user ${userId}`)

    // If no conversations found, return empty array
    if (conversations.length === 0) {
      console.log("No conversations found for user")
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get other users' information for each conversation
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get other users in the conversation
        const otherUserIds = conversation.members.filter((member: string) => member !== userId)
        console.log(`Conversation ${conversation._id}: Other users: ${otherUserIds.join(", ")}`)

        // Get user details for other members
        const otherUsers = await db
          .collection("users")
          .find({ $or: [{ _id: { $in: otherUserIds } }, { username: { $in: otherUserIds } }] })
          .toArray()

        console.log(`Found ${otherUsers.length} other users for conversation ${conversation._id}`)

        // Get unread message count
        const unreadCount = await db.collection("messages").countDocuments({
          conversationId: conversation._id.toString(),
          senderId: { $ne: userId },
          read: { $ne: true },
        })

        // Get the last message
        const lastMessage = await db
          .collection("messages")
          .find({ conversationId: conversation._id.toString() })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()

        return {
          ...conversation,
          otherUsers,
          unread: unreadCount,
          lastMessage:
            lastMessage.length > 0
              ? lastMessage[0].text || lastMessage[0].message || "Sent a GIF"
              : conversation.lastMessage || "No messages yet",
          lastMessageAt: lastMessage.length > 0 ? lastMessage[0].createdAt : conversation.updatedAt,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: enhancedConversations,
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch conversations",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
