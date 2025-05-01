import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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
    return NextResponse.json({ success: false, message: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversationId, senderId, receiverId, message, members, clipLink, gifMood } = body

    if (!conversationId || !senderId || (!message && !clipLink)) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields. Required: conversationId, senderId, and either message or clipLink",
        },
        { status: 400 },
      )
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()
    const messagesCollection = db.collection("messages")

    // Create message object
    const messageText = message || "Sent a GIF"
    const newMessage = {
      conversationId,
      senderId,
      receiverId: receiverId || "unknown",
      text: messageText,
      clipLink,
      gifMood,
      members: Array.isArray(members) ? members : [senderId, receiverId || "unknown"],
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert message into database
    const result = await messagesCollection.insertOne(newMessage)

    // Update conversation with last message
    const conversationsCollection = db.collection("conversations")
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: messageText,
          lastMessageAt: new Date(),
          lastMessageSenderId: senderId,
          updatedAt: new Date(),
        },
      },
    )

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
    return NextResponse.json({ success: false, message: "Failed to save message" }, { status: 500 })
  }
}
