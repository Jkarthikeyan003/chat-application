import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Define TypeScript interfaces
interface Message {
  _id?: string
  conversationId: string
  senderId: string
  content: string
  gifUrl?: string
  gifMood?: string
  createdAt?: Date
  updatedAt?: Date
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Get messages for the conversation with pagination
    const messages = await db
      .collection("messages")
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalMessages = await db.collection("messages").countDocuments({ conversationId })

    // Calculate total pages
    const totalPages = Math.ceil(totalMessages / limit)

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { conversationId, content, gifUrl, gifMood } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json({ error: "Conversation ID and content are required" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Create new message
    const newMessage: Message = {
      conversationId,
      senderId: session.user.id,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add gifUrl if provided
    if (gifUrl) {
      newMessage.gifUrl = gifUrl
    }

    // Add gifMood if provided
    if (gifMood) {
      newMessage.gifMood = gifMood
    }

    // Insert message
    const result = await db.collection("messages").insertOne(newMessage)

    // Update conversation's lastMessage and updatedAt
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: content,
          lastMessageDate: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      message: {
        ...newMessage,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
