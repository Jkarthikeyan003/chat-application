import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/token-utils"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  try {
    const { id } = params

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

    // Convert string ID to ObjectId if needed
    let conversationId
    try {
      conversationId = new ObjectId(id)
    } catch (error) {
      conversationId = id // Use as string if not a valid ObjectId
    }

    // Find the conversation
    const conversation = await db.collection("conversations").findOne({
      _id: conversationId,
      members: userId,
    })

    if (!conversation) {
      // For development, return mock data if no conversation found
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          success: true,
          data: {
            _id: id,
            members: [userId, "mock-user-id"],
            createdAt: new Date(),
            updatedAt: new Date(),
            otherUsers: [
              {
                _id: "mock-user-id",
                name: "Jane Smith",
                username: "janesmith",
                avatar: "/diverse-woman-portrait.png",
              },
            ],
          },
        })
      }

      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 })
    }

    // Get other users in the conversation
    const otherUserIds = conversation.members.filter((member) => member !== userId)

    // Get user details for other members
    const otherUsers = await db
      .collection("users")
      .find({ _id: { $in: otherUserIds } })
      .toArray()

    // Get the last message
    const lastMessage = await db
      .collection("messages")
      .find({ conversationId: conversation._id.toString() })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    // Return the conversation with other users' information
    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        otherUsers,
        lastMessage: lastMessage.length > 0 ? lastMessage[0] : null,
      },
    })
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch conversation" }, { status: 500 })
  }
}
