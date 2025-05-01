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

// Authenticate request function
async function authenticateRequest(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")

    // Check if token exists and is in the correct format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "Missing or invalid authorization header" }
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    try {
      const decodedToken = jwt.verify(token, JWT_SECRET)
      return {
        user: {
          userId: decodedToken.userId,
          username: decodedToken.username,
          role: decodedToken.role,
        },
      }
    } catch (error) {
      return { user: null, error: "Invalid token" }
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { user: null, error: "Authentication failed" }
  }
}

// Create auth response function
function createAuthResponse(message, status = 401) {
  return NextResponse.json({ success: false, message: `Unauthorized: ${message}` }, { status })
}

export async function GET(request, { params }) {
  let client
  try {
    console.log("Chat detail API called for ID:", params.id)

    // Authenticate the request
    const { user, error } = await authenticateRequest(request)

    if (!user) {
      return createAuthResponse(error || "Authentication failed")
    }

    const chatId = params.id

    if (!chatId) {
      return NextResponse.json({ success: false, message: "Chat ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    const { db, client: mongoClient } = await connectToDatabase()
    client = mongoClient // Store for cleanup in finally block
    console.log("Connected to MongoDB successfully")

    const conversationsCollection = db.collection("conversations")

    // Try to convert to ObjectId if it's a valid format
    let objectId
    try {
      if (chatId.length === 24) {
        objectId = new ObjectId(chatId)
      }
    } catch (error) {
      console.error("Invalid ObjectId format:", error)
    }

    // Find the conversation
    console.log("Finding chat with ID:", chatId)
    const conversation = await conversationsCollection.findOne({
      _id: objectId || chatId,
    })

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 })
    }

    // Check if the user is a member of this conversation
    if (!conversation.members.includes(user.username)) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view this chat",
        },
        { status: 403 },
      )
    }

    // Get user details for the other members
    const usersCollection = db.collection("users")
    const otherMembers = await Promise.all(
      conversation.members
        .filter((memberId) => memberId !== user.username)
        .map(async (memberId) => {
          const memberUser = await usersCollection.findOne(
            { username: memberId },
            { projection: { password: 0 } }, // Exclude password
          )
          return memberUser || { username: memberId }
        }),
    )

    // Return the conversation with other member details
    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        otherMembers,
      },
    })
  } catch (error) {
    console.error("Error retrieving chat:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve chat",
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
