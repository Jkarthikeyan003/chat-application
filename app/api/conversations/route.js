import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/token-utils"

export async function GET(request) {
  try {
    // Get URL parameters
    const url = new URL(request.url)
    // const skipMock = url.searchParams.get("skipMock") === "true"

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
      userId = decoded.userId || decoded.username
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ success: false, message: "Unauthorized: Invalid token" }, { status: 401 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    console.log("userId",userId)
    // Find conversations where the user is a member
    const conversations = await db
      .collection("conversations")
      .find({ members: userId })
      .sort({ updatedAt: -1 })
      .toArray()

    // If no conversations found and not skipping mock data, return mock data

    // Get other users' information for each conversation
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get other users in the conversation
        const otherUserIds = conversation.members.filter((member) => member !== userId)

        // Get user details for other members
        const otherUsers = await db
          .collection("users")
          .find({ username: { $in: otherUserIds } })
          .project({ password: 0 }) // Exclude password
          .toArray()

        // If no other users found, create placeholder users
        if (otherUsers.length === 0) {
          otherUsers.push({
            _id: otherUserIds[0],
            username: otherUserIds[0],
            name: `User ${otherUserIds[0]}`,
            avatar: "/abstract-geometric-shapes.png",
          })
        }

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
          lastMessage: lastMessage.length > 0 ? lastMessage[0].message : null,
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
