import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import jwt from "jsonwebtoken"

// JWT secret for verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key-change-this-in-production"

// Connect to MongoDB function (inline to avoid import issues)
async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    // Get database name from connection string or use default
    let dbName = "chat-app"
    try {
      if (MONGODB_URI.includes("mongodb://") || MONGODB_URI.includes("mongodb+srv://")) {
        const url = new URL(MONGODB_URI.replace("mongodb://", "http://").replace("mongodb+srv://", "http://"))
        if (url.pathname && url.pathname.length > 1) {
          dbName = url.pathname.substring(1)
        }
      }
    } catch (error) {
      console.warn("Could not parse database name from URI, using default")
    }

    const db = client.db(dbName)
    return { client, db }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function GET(request) {
  let client
  try {
    console.log("Messages list API called")

    // Get authorization header
    const authHeader = request.headers.get("authorization")

    // Check if token exists and is in the correct format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header")
      return NextResponse.json({ success: false, message: "Unauthorized: Missing or invalid token" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    let decodedToken
    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
      console.log("Token verified successfully:", decodedToken)
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ success: false, message: "Unauthorized: Invalid token" }, { status: 401 })
    }

    const url = new URL(request.url)
    const conversationId = url.searchParams.get("conversationId")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const userId = url.searchParams.get("userId") // Optional: to mark messages as read for this user

    if (!conversationId) {
      return NextResponse.json({ success: false, message: "Conversation ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    const { db, client: mongoClient } = await connectToDatabase()
    client = mongoClient // Store for cleanup in finally block
    console.log("Connected to MongoDB successfully")

    const messagesCollection = db.collection("messages")

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await messagesCollection.countDocuments({ conversationId })
    const totalPages = Math.ceil(totalCount / limit)

    console.log(`Found ${totalCount} messages for conversation ${conversationId}`)

    // Get messages for the conversation, sorted by creation date (newest first)
    const messages = await messagesCollection
      .find({ conversationId })
      .sort({ createdAt: -1 }) // Descending order (newest first)
      .skip(skip)
      .limit(limit)
      .toArray()

    console.log(`Retrieved ${messages.length} messages for page ${page}`)

    // If userId is provided, mark messages as read for this user
    if (userId) {
      const messagesToMarkAsRead = messages.filter((msg) => msg.receiverId === userId && !msg.read)

      if (messagesToMarkAsRead.length > 0) {
        console.log(`Marking ${messagesToMarkAsRead.length} messages as read for user ${userId}`)
        const messageIds = messagesToMarkAsRead.map((msg) => msg._id)

        // Mark messages as read
        await messagesCollection.updateMany(
          { _id: { $in: messageIds } },
          { $set: { read: true, updatedAt: new Date() } },
        )

        // Reset unread count in conversation for this user
        const conversationsCollection = db.collection("conversations")
        await conversationsCollection.updateOne({ _id: conversationId }, { $set: { [`unreadCount.${userId}`]: 0 } })
      }
    }

    // Return messages with pagination info
    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error retrieving messages:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve messages" }, { status: 500 })
  } finally {
    // Close MongoDB connection if it was opened
    if (client) {
      try {
        await client.close()
        console.log("MongoDB connection closed")
      } catch (closeError) {
        console.error("Error closing MongoDB connection:", closeError)
      }
    }
  }
}
