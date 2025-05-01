import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { verifyToken } from "@/lib/token-utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ success: false, message: "Conversation ID is required" }, { status: 400 })
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized: No token provided" }, { status: 401 })
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Fetch messages
    const messages = await db.collection("messages").find({ conversationId }).sort({ createdAt: 1 }).toArray()

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch messages",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { conversationId, message, receiverId, clipLink, clipThumbnailUrl, gifMood } = body

    if (!conversationId || (!message && !clipLink)) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields. Required: conversationId and either message or clipLink",
        },
        { status: 400 },
      )
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()
    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")

    // Find the conversation to get members
    let conversation
    let conversationObjectId

    try {
      if (conversationId.length === 24) {
        conversationObjectId = new ObjectId(conversationId)
        conversation = await conversationsCollection.findOne({ _id: conversationObjectId })
      } else {
        conversation = await conversationsCollection.findOne({ _id: conversationId })
        conversationObjectId = conversation?._id
      }
    } catch (error) {
      console.error("Error finding conversation:", error)
      // If we can't find the conversation, we'll create a new one below
    }

    // Determine members
    let members = [userId]
    if (receiverId) {
      members.push(receiverId)
    } else if (conversation && conversation.members) {
      members = conversation.members
    }

    // Create message object
    const messageText = message || "Sent a GIF"
    const newMessage = {
      conversationId,
      senderId: userId,
      receiverId: receiverId || members.find((m) => m !== userId) || "unknown",
      text: messageText,
      message: messageText, // For backward compatibility
      clipLink,
      clipThumbnailUrl,
      gifMood,
      members,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert message into database
    const result = await messagesCollection.insertOne(newMessage)
    console.log("Message inserted with ID:", result.insertedId)

    // Update or create conversation
    const updateResult = await conversationsCollection.updateOne(
      { _id: conversationObjectId || conversationId },
      {
        $set: {
          lastMessage: messageText,
          lastMessageAt: new Date(),
          lastMessageSenderId: userId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          members,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    console.log("Conversation updated:", updateResult.acknowledged)

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Message saved successfully",
      data: {
        ...newMessage,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Error saving message:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save message",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
