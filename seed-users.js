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

async function seedUsers() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const usersCollection = db.collection("users")

    // Check if users already exist
    const existingUsers = await usersCollection.countDocuments()
    if (existingUsers > 0) {
      console.log(`Found ${existingUsers} existing users. Skipping seed.`)
      console.log("To force re-seed, delete existing users first.")
      return
    }

    // Create test users with hashed passwords
    const users = [
      {
        username: "test1",
        password: await bcrypt.hash("1234567890", 10),
        email: "test1@example.com",
        fullName: "Test User One",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "test2",
        password: await bcrypt.hash("1234567890", 10),
        email: "test2@example.com",
        fullName: "Test User Two",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "admin",
        password: await bcrypt.hash("adminpassword", 10),
        email: "admin@example.com",
        fullName: "Admin User",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    console.log("Inserting users into database...")
    const result = await usersCollection.insertMany(users)

    console.log(`Successfully inserted ${result.insertedCount} users:`)
    users.forEach((user) => {
      console.log(`- ${user.username} (${user.role})`)
    })
  } catch (error) {
    console.error("Error seeding users:", error)
    console.error("Details:", error.message)
    if (error.name === "MongoServerSelectionError") {
      console.error("Could not connect to MongoDB. Please check your connection string and network.")
    }
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

// Run the seed function
seedUsers()
