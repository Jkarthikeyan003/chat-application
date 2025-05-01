import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set")
  process.exit(1)
}

async function insertTestUsers() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const usersCollection = db.collection("users")

    // Check if users already exist
    const existingUser1 = await usersCollection.findOne({ username: "testuser1" })
    const existingUser2 = await usersCollection.findOne({ username: "testuser2" })

    if (existingUser1 && existingUser2) {
      console.log("Test users already exist in the database.")
      console.log(`- testuser1 (${existingUser1._id})`)
      console.log(`- testuser2 (${existingUser2._id})`)
      return
    }

    // Hash passwords
    // const salt = await bcrypt.genSalt(10)
    // const password1Hash = await bcrypt.hash("1234567890", salt)
    const password1Hash = "1234567890"
    // Create test users
    const users = []

    if (!existingUser1) {
      users.push({
        username: "testuser1",
        password: password1Hash,
        email: "testuser1@example.com",
        fullName: "Test User One",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    if (!existingUser2) {
      users.push({
        username: "testuser2",
        password: password1Hash,
        email: "testuser2@example.com",
        fullName: "Test User Two",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    if (users.length > 0) {
      console.log(`Inserting ${users.length} test users into database...`)
      const result = await usersCollection.insertMany(users)

      console.log(`Successfully inserted ${result.insertedCount} users:`)
      for (const user of users) {
        console.log(`- ${user.username} (${user.email})`)
      }

      console.log("\nTest User Credentials:")
      if (!existingUser1) {
        console.log("Username: testuser1")
        console.log("Password: password123")
      }
      if (!existingUser2) {
        console.log("Username: testuser2")
        console.log("Password: password456")
      }
    } else {
      console.log("No new users to insert.")
    }
  } catch (error) {
    console.error("Error inserting test users:", error)
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

// Run the function
insertTestUsers()
