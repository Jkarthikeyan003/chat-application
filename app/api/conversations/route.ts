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
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ success: false, message: "Unauthorized: Invalid token" }, { status: 401 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Find conversations where the user is a member
    const conversations = await db
      .collection("conversations")
      .find({ members: userId })
      .sort({ updatedAt: -1 })
      .toArray()

    // If no conversations found, return mock data for development
    if (conversations.length === 0) {
      console.log("No conversations found, returning mock data for development")
      return NextResponse.json({
        success: true,
        data: [
          {
            _id: "mock-conv-1",
            members: [userId, "alice"],
            lastMessage: "Hey, how are you?",
            lastMessageAt: new Date(),
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(),
            otherUsers: [
              {
                _id: "alice",
                name: "Alice Johnson",
                username: "alice",
                avatar: "/diverse-woman-portrait.png",
              },
            ],
            unread: 2,
          },
          {
            _id: "mock-conv-2",
            members: [userId, "bob"],
            lastMessage: "Did you see the latest update?",
            lastMessageAt: new Date(Date.now() - 3600000),
            createdAt: new Date(Date.now() - 172800000),
            updatedAt: new Date(Date.now() - 3600000),
            otherUsers: [
              {
                _id: "bob",
                name: "Bob Smith",
                username: "bob",
                avatar: "/thoughtful-man.png",
              },
            ],
            unread: 0,
          },
          {
            _id: "mock-conv-3",
            members: [userId, "carol"],
            lastMessage: "Let's meet tomorrow at 2pm",
            lastMessageAt: new Date(Date.now() - 7200000),
            createdAt: new Date(Date.now() - 259200000),
            updatedAt: new Date(Date.now() - 7200000),
            otherUsers: [
              {
                _id: "carol",
                name: "Carol Williams",
                username: "carol",
                avatar: "/woman-with-stylish-glasses.png",
              },
            ],
            unread: 1,
          },
        ],
      })
    }

    // Get other users' information for each conversation
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get other users in the conversation
        const otherUserIds = conversation.members.filter((member) => member !== userId)

        // Get user details for other members
        const otherUsers = await db
          .collection("users")
          .find({ _id: { $in: otherUserIds } })
          .toArray()

        // Get unread message count
        const unreadCount = await db.collection("messages").countDocuments({
          conversationId: conversation._id.toString(),
          sender: { $ne: userId },
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
            lastMessage.length > 0 ? lastMessage[0].text || lastMessage[0].message : conversation.lastMessage || null,
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
    return NextResponse.json({ success: false, message: "Failed to fetch conversations" }, { status: 500 })
  }
}
