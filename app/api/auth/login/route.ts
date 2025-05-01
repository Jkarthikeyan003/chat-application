import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key-change-this-in-production"

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined")
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    console.log(`Login attempt for username: ${username}`)

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI!)
    await client.connect()

    const db = client.db()
    const usersCollection = db.collection("users")

    // Find user by username
        // const salt = await bcrypt.genSalt(10)
        // const password1Hash = await bcrypt.hash(password, salt)
    const user = await usersCollection.findOne({ username, password })

    // Close MongoDB connection
    await client.close()

    if (!user) {
      console.log(`User not found: ${username}`)
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role || "user",
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    console.log(`Login successful for user: ${username}`)

    // Return success response with token and user info
    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role || "user",
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
