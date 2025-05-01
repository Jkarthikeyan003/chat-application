import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
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

// Create message function (inline to avoid import issues)
function createMessage(data) {
  const now = new Date()

  return {
    conversationId: data.conversationId || "",
    senderId: data.senderId || "",
    receiverId: data.receiverId || "",
    message: data.message || "",
    members: data.members || [],
    clipThumbnailUrl: data.clipThumbnailUrl,
    clipLink: data.clipLink,
    read: data.read !== undefined ? data.read : false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
}

export async function POST(request) {
  let client
  try {
    console.log("Message send API called")

    // Get authorization header
    const authHeader = request.headers.get("authorization")

    // For debugging purposes, make authentication optional
    let userId = null
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      try {
        const decodedToken = jwt.verify(token, JWT_SECRET)
        userId = decodedToken.userId || decodedToken.username
        console.log("Token verified successfully for user:", userId)
      } catch (error) {
        console.warn("Token verification failed, continuing without authentication:", error)
      }
    } else {
      console.warn("No authorization header provided, continuing without authentication")
    }

    // Parse request body
    const body = await request.json()
    console.log("Received message data:", JSON.stringify(body, null, 2))

    // Validate required fields
    const { senderId, receiverId, message, conversationId } = body

    if (!senderId) {
      console.error("Missing senderId")
      return NextResponse.json({ success: false, message: "Missing required field: senderId" }, { status: 400 })
    }

    if (!receiverId) {
      console.error("Missing receiverId")
      return NextResponse.json({ success: false, message: "Missing required field: receiverId" }, { status: 400 })
    }

    // For GIF messages, the message field might be empty
    const isGifMessage = body.clipLink && body.clipThumbnailUrl
    if (!message && !isGifMessage) {
      console.error("Missing message content")
      return NextResponse.json(
        { success: false, message: "Missing required field: message (or clipLink for GIF messages)" },
        { status: 400 },
      )
    }

    // Determine conversation members
    const messageMembers = body.members || [senderId, receiverId]

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    const { db, client: mongoClient } = await connectToDatabase()
    client = mongoClient // Store for cleanup in finally block
    console.log("Connected to MongoDB successfully")

    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")

    // Create message object
    const messageText = message || "Sent a GIF"
    const newMessage = createMessage({
      conversationId: conversationId || new ObjectId().toString(),
      senderId,
      receiverId,
      message: messageText,
      members: messageMembers,
      clipThumbnailUrl: body.clipThumbnailUrl,
      clipLink: body.clipLink,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log("Created message object:", JSON.stringify(newMessage, null, 2))

    // Insert message into database
    console.log("Inserting message into database...")
    const result = await messagesCollection.insertOne(newMessage)
    console.log("Message inserted successfully with ID:", result.insertedId)

    // Determine the conversation ID to use
    let finalConversationId = newMessage.conversationId
    let conversation = null

    // Check if conversation exists by ID
    if (conversationId) {
      try {
        console.log("Looking for existing conversation with ID:", conversationId)
        conversation = await conversationsCollection.findOne({
          _id:
            typeof conversationId === "string" && conversationId.length === 24
              ? new ObjectId(conversationId)
              : conversationId,
        })

        if (conversation) {
          console.log("Found existing conversation by ID")
          finalConversationId = conversation._id.toString()
        } else {
          console.log("No conversation found with provided ID, will create new one")
        }
      } catch (error) {
        console.error("Error finding conversation by ID:", error)
      }
    }

    // If no conversation found by ID, look for existing conversation between these users
    if (!conversation) {
      try {
        console.log("Looking for existing conversation between users:", messageMembers)
        conversation = await conversationsCollection.findOne({
          members: { $all: messageMembers, $size: messageMembers.length },
        })

        if (conversation) {
          console.log("Found existing conversation between users")
          finalConversationId = conversation._id.toString()
        } else {
          console.log("No existing conversation found between users, will create new one")
        }
      } catch (error) {
        console.error("Error finding conversation between users:", error)
      }
    }

    // Update the message with the correct conversation ID if needed
    if (finalConversationId !== newMessage.conversationId) {
      console.log("Updating message with correct conversation ID:", finalConversationId)
      await messagesCollection.updateOne({ _id: result.insertedId }, { $set: { conversationId: finalConversationId } })
      newMessage.conversationId = finalConversationId
    }

    // Prepare conversation ID for MongoDB
    let conversationObjectId
    try {
      // Try to convert to ObjectId if it's a valid format
      if (typeof finalConversationId === "string" && finalConversationId.length === 24) {
        conversationObjectId = new ObjectId(finalConversationId)
      } else {
        conversationObjectId = finalConversationId
      }
    } catch (error) {
      console.error("Error converting conversation ID to ObjectId:", error)
      conversationObjectId = finalConversationId
    }

    // Update or create the conversation
    console.log("Updating or creating conversation with ID:", finalConversationId)
    try {
      const updateResult = await conversationsCollection.updateOne(
        { _id: conversationObjectId },
        {
          $set: {
            lastMessage: messageText,
            lastMessageAt: new Date(),
            lastMessageSenderId: senderId,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            members: messageMembers,
            createdAt: new Date(),
          },
          $inc: {
            [`unreadCount.${receiverId}`]: 1, // Increment unread count for receiver
          },
        },
        { upsert: true },
      )

      console.log(
        "Conversation update result:",
        JSON.stringify(
          {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            upsertedCount: updateResult.upsertedCount,
            upsertedId: updateResult.upsertedId,
          },
          null,
          2,
        ),
      )
    } catch (error) {
      console.error("Error updating conversation:", error)
      // Continue execution even if conversation update fails
    }

    // Return success response
    console.log("Message send API completed successfully")
    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: {
        ...newMessage,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Error in message send API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
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
