import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set")
  process.exit(1)
}

async function seedConversationsAndMessages() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const usersCollection = db.collection("users")
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")

    // Get existing users
    const users = await usersCollection.find({}).toArray()

    if (users.length < 2) {
      console.error("Error: Need at least 2 users in the database to create conversations")
      return
    }

    console.log(`Found ${users.length} users in the database`)

    // Extract usernames for easier reference
    const usernames = users.map((user) => user.username)
    console.log("Available users:", usernames.join(", "))

    // Check if conversations already exist
    const existingConversations = await conversationsCollection.countDocuments()

    if (existingConversations > 0) {
      console.log(`Found ${existingConversations} existing conversations. Skipping conversation creation.`)
      console.log("To force re-seed, delete existing conversations first.")
    } else {
      // Create conversations between all pairs of users
      const conversations = []
      const conversationMap = new Map() // To keep track of conversation IDs between user pairs

      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i]
          const user2 = users[j]

          const conversationId = new ObjectId()
          const conversation = {
            _id: conversationId,
            members: [user1.username, user2.username],
            lastMessage: `Hello from ${user1.username} to ${user2.username}`,
            lastMessageAt: new Date(),
            lastMessageSenderId: user1.username,
            unreadCount: { [user2.username]: 1 },
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          conversations.push(conversation)

          // Store the conversation ID for this user pair
          const pairKey = [user1.username, user2.username].sort().join("_")
          conversationMap.set(pairKey, conversationId)
        }
      }

      if (conversations.length > 0) {
        console.log(`Creating ${conversations.length} conversations...`)
        const result = await conversationsCollection.insertMany(conversations)
        console.log(`Successfully inserted ${result.insertedCount} conversations`)

        // Log the created conversations
        conversations.forEach((conv) => {
          console.log(`- Conversation between ${conv.members.join(" and ")}`)
        })
      }

      // Check if messages already exist
      const existingMessages = await messagesCollection.countDocuments()

      if (existingMessages > 0) {
        console.log(`Found ${existingMessages} existing messages. Skipping message creation.`)
        console.log("To force re-seed, delete existing messages first.")
      } else {
        // Create messages for each conversation
        const messages = []

        for (let i = 0; i < users.length; i++) {
          for (let j = i + 1; j < users.length; j++) {
            const user1 = users[i]
            const user2 = users[j]

            // Get the conversation ID for this user pair
            const pairKey = [user1.username, user2.username].sort().join("_")
            const conversationId = conversationMap.get(pairKey)

            if (!conversationId) continue

            // Create sample messages
            const sampleMessages = [
              {
                conversationId: conversationId.toString(),
                senderId: user1.username,
                receiverId: user2.username,
                message: `Hello ${user2.username}, how are you?`,
                members: [user1.username, user2.username],
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
                updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
              },
              {
                conversationId: conversationId.toString(),
                senderId: user2.username,
                receiverId: user1.username,
                message: `Hi ${user1.username}! I'm doing well, thanks for asking. How about you?`,
                members: [user1.username, user2.username],
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
                updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
              },
              {
                conversationId: conversationId.toString(),
                senderId: user1.username,
                receiverId: user2.username,
                message: "I'm good too! Just working on some new projects.",
                members: [user1.username, user2.username],
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
                updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
              },
              {
                conversationId: conversationId.toString(),
                senderId: user2.username,
                receiverId: user1.username,
                message: "That sounds interesting! What kind of projects?",
                members: [user1.username, user2.username],
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
                updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
              },
              {
                conversationId: conversationId.toString(),
                senderId: user1.username,
                receiverId: user2.username,
                message: "Mostly web development and some mobile apps. I'll tell you more when we meet!",
                members: [user1.username, user2.username],
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
                updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
              },
            ]

            // Add a GIF message for variety
            if (Math.random() > 0.5) {
              // Get a random media item for the GIF
              const mediaCollection = db.collection("media")
              const mediaItems = await mediaCollection.find({}).limit(10).toArray()

              if (mediaItems.length > 0) {
                const randomMedia = mediaItems[Math.floor(Math.random() * mediaItems.length)]

                sampleMessages.push({
                  conversationId: conversationId.toString(),
                  senderId: user2.username,
                  receiverId: user1.username,
                  message: "Check out this GIF!",
                  members: [user1.username, user2.username],
                  clipLink: randomMedia.clipLink,
                  clipThumbnailUrl: randomMedia.clipThumbnailUrl,
                  read: false,
                  createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                  updatedAt: new Date(Date.now() - 1000 * 60 * 30),
                })
              }
            }

            messages.push(...sampleMessages)
          }
        }

        if (messages.length > 0) {
          console.log(`Creating ${messages.length} messages...`)
          const result = await messagesCollection.insertMany(messages)
          console.log(`Successfully inserted ${result.insertedCount} messages`)
        }
      }
    }

    // Update conversation lastMessage data based on the most recent message
    const conversations = await conversationsCollection.find({}).toArray()

    for (const conversation of conversations) {
      const latestMessage = await messagesCollection
        .find({ conversationId: conversation._id.toString() })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      if (latestMessage.length > 0) {
        const message = latestMessage[0]
        await conversationsCollection.updateOne(
          { _id: conversation._id },
          {
            $set: {
              lastMessage: message.message,
              lastMessageAt: message.createdAt,
              lastMessageSenderId: message.senderId,
              updatedAt: new Date(),
            },
          },
        )
        console.log(`Updated conversation ${conversation._id} with latest message data`)
      }
    }

    console.log("Seed completed successfully!")
  } catch (error) {
    console.error("Error seeding conversations and messages:", error)
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

// Run the seed function
seedConversationsAndMessages()
