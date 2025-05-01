import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    console.log("MongoDB debug API called")

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    const { db, client } = await connectToDatabase()
    console.log("Connected to MongoDB successfully")

    // Get database stats
    const stats = await db.stats()

    // Get collection names
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c: any) => c.name)

    // Get counts for key collections
    const counts : any = {}
    for (const name of ["messages", "conversations", "users", "media"]) {
      if (collectionNames.includes(name)) {
        counts[name] = await db.collection(name).countDocuments()
      } else {
        counts[name] = "Collection not found"
      }
    }

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      database: {
        name: db.databaseName,
        stats,
        collections: collectionNames,
        counts,
      },
    })
  } catch (error) {
    console.error("Error in MongoDB debug API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("MongoDB test message API called")

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    const { db } = await connectToDatabase()
    console.log("Connected to MongoDB successfully")

    // Create test message
    const testMessage = {
      conversationId: new ObjectId().toString(),
      senderId: "test-sender",
      receiverId: "test-receiver",
      message: "Test message from debug API " + new Date().toISOString(),
      members: ["test-sender", "test-receiver"],
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert test message
    console.log("Inserting test message...")
    const messagesCollection = db.collection("messages")
    const result = await messagesCollection.insertOne(testMessage)
    console.log("Test message inserted with ID:", result.insertedId)

    // Create/update test conversation
    console.log("Updating test conversation...")
    const conversationsCollection = db.collection("conversations")
    const conversationResult = await conversationsCollection.updateOne(
      { _id: new ObjectId(testMessage.conversationId) },
      {
        $set: {
          lastMessage: testMessage.message,
          lastMessageAt: new Date(),
          lastMessageSenderId: testMessage.senderId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          members: testMessage.members,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({
      success: true,
      message: "Test message created successfully",
      data: {
        message: {
          ...testMessage,
          _id: result.insertedId,
        },
        conversation: {
          matchedCount: conversationResult.matchedCount,
          modifiedCount: conversationResult.modifiedCount,
          upsertedCount: conversationResult.upsertedCount,
          upsertedId: conversationResult.upsertedId,
        },
      },
    })
  } catch (error) {
    console.error("Error in MongoDB test message API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create test message",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
