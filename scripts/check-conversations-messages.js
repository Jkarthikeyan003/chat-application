import { MongoClient } from "mongodb"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set")
  process.exit(1)
}

async function checkConversationsAndMessages() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")

    // Count conversations
    const conversationCount = await conversationsCollection.countDocuments()
    console.log(`Total conversations in database: ${conversationCount}`)

    if (conversationCount === 0) {
      console.log("No conversations found. Please run the seed script first.")
      return
    }

    // Get conversations
    const conversations = await conversationsCollection.find({}).toArray()

    console.log("\n=== CONVERSATIONS ===")
    for (const conversation of conversations) {
      console.log(`\nConversation ID: ${conversation._id}`)
      console.log(`Members: ${conversation.members.join(", ")}`)
      console.log(`Last Message: ${conversation.lastMessage}`)
      console.log(`Last Message At: ${conversation.lastMessageAt}`)
      console.log(`Last Message Sender: ${conversation.lastMessageSenderId}`)

      // Count messages in this conversation
      const messageCount = await messagesCollection.countDocuments({
        conversationId: conversation._id.toString(),
      })
      console.log(`Message Count: ${messageCount}`)

      // Get the most recent messages
      const recentMessages = await messagesCollection
        .find({ conversationId: conversation._id.toString() })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()

      if (recentMessages.length > 0) {
        console.log("\nRecent Messages:")
        for (const message of recentMessages) {
          console.log(
            `- From: ${message.senderId}, Message: ${message.message.substring(0, 30)}${message.message.length > 30 ? "..." : ""}`,
          )
          if (message.clipLink) {
            console.log(`  [Has GIF: ${message.clipLink}]`)
          }
        }
      }

      console.log("------------------------")
    }

    // Count total messages
    const messageCount = await messagesCollection.countDocuments()
    console.log(`\nTotal messages in database: ${messageCount}`)

    // Count GIF messages
    const gifMessageCount = await messagesCollection.countDocuments({
      clipLink: { $exists: true, $ne: null },
    })
    console.log(`GIF messages: ${gifMessageCount}`)
  } catch (error) {
    console.error("Error checking conversations and messages:", error)
  } finally {
    if (client) {
      await client.close()
      console.log("\nMongoDB connection closed")
    }
  }
}

// Run the check function
checkConversationsAndMessages()
