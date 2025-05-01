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

async function checkUsers() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    console.log(`Using connection string: ${MONGODB_URI.substring(0, 20)}...`)
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    // Get database name from connection string
    const dbName = new URL(MONGODB_URI.replace("mongodb://", "http://")).pathname.substring(1) || "chat-app"
    console.log(`Using database: ${dbName}`)

    const db = client.db(dbName)
    const usersCollection = db.collection("users")

    // Count users
    const userCount = await usersCollection.countDocuments()
    console.log(`Total users in database: ${userCount}`)

    // List all users (without showing passwords)
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray()

    console.log("\nUsers in database:")
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`)
      console.log(`Username: ${user.username}`)
      console.log(`Email: ${user.email}`)
      console.log(`Full Name: ${user.fullName}`)
      console.log(`Role: ${user.role}`)
      console.log(`Created: ${user.createdAt}`)
    })
  } catch (error) {
    console.error("Error checking users:", error)
    console.error("Details:", error.message)
    if (error.name === "MongoServerSelectionError") {
      console.error("Could not connect to MongoDB. Please check your connection string and network.")
    }
  } finally {
    if (client) {
      await client.close()
      console.log("\nMongoDB connection closed")
    }
  }
}

// Run the check function
checkUsers()
