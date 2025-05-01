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

async function testConnection() {
  let client

  try {
    console.log("Testing MongoDB connection...")
    console.log(`Using connection string: ${MONGODB_URI.substring(0, 20)}...`)

    client = new MongoClient(MONGODB_URI)
    await client.connect()

    console.log("✅ Connected to MongoDB successfully!")

    // Get database name from connection string
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

    console.log(`Using database: ${dbName}`)

    const db = client.db(dbName)

    // List collections
    const collections = await db.listCollections().toArray()
    console.log("\nCollections in database:")

    if (collections.length === 0) {
      console.log("No collections found. Database may be empty.")
    } else {
      collections.forEach((collection) => {
        console.log(`- ${collection.name}`)
      })
    }
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error)
    console.error("Details:", error.message)

    if (error.name === "MongoServerSelectionError") {
      console.error("\nTroubleshooting tips:")
      console.error("1. Check if your MongoDB server is running")
      console.error("2. Verify your connection string is correct")
      console.error("3. Check network connectivity and firewall settings")
      console.error("4. If using MongoDB Atlas, verify IP whitelist settings")
    }
  } finally {
    if (client) {
      await client.close()
      console.log("\nMongoDB connection closed")
    }
  }
}

// Run the test
testConnection()
