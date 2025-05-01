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
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const usersCollection = db.collection("users")

    // Count users
    const userCount = await usersCollection.countDocuments()
    console.log(`Total users in database: ${userCount}`)

    // List all users (without showing passwords)
    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray()

    console.log("\nUsers in database:")
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`)
      console.log(`ID: ${user._id}`)
      console.log(`Username: ${user.username}`)
      console.log(`Email: ${user.email}`)
      console.log(`Full Name: ${user.fullName || "N/A"}`)
      console.log(`Role: ${user.role || "N/A"}`)
      console.log(`Created: ${user.createdAt || "N/A"}`)
    })
  } catch (error) {
    console.error("Error checking users:", error)
  } finally {
    if (client) {
      await client.close()
      console.log("\nMongoDB connection closed")
    }
  }
}

// Run the check function
checkUsers()
