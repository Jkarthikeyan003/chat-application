import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import { verifyToken } from "@/lib/token-utils"

export async function POST(request) {
  let client
  try {
    // Parse request body
    const body = await request.json()
    const { messageText, mood, limit = 10, page = 1 } = body

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    console.log(`GIF Filter API: page=${page}, limit=${limit}, skip=${skip}`)

    // Verify token (optional)
    let userId = null
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const decoded = await verifyToken(token)
        userId = decoded.userId
        console.log(`Authenticated user: ${userId}`)
      } catch (error) {
        console.error("Token verification failed:", error)
        // Continue without user context
      }
    }

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI
    if (!MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI environment variable")
    }

    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB")

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
    const mediaCollection = db.collection("media")

    // Build query based on message text and mood
    const query = {}

    if (messageText) {
      // Search in multiple fields
      query.$or = [
        { transcript: { $regex: messageText, $options: "i" } },
        { movieName: { $regex: messageText, $options: "i" } },
        { artist: { $regex: messageText, $options: "i" } },
        { characterNames: { $regex: messageText, $options: "i" } },
        { place: { $regex: messageText, $options: "i" } },
      ]
    }

    if (mood) {
      query.mood = { $regex: mood, $options: "i" }
    }

    console.log("Query:", JSON.stringify(query))

    // Get total count for pagination
    const total = await mediaCollection.countDocuments(query)
    console.log(`Total matching documents: ${total}`)

    // Get media items with pagination
    const gifs = await mediaCollection
      .find(query)
      .sort({ _id: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .toArray()

    console.log(`Retrieved ${gifs.length} GIFs`)

    // If no items found, return mock data for development
    if (gifs.length === 0 && page === 1) {
      console.log("No GIFs found, returning mock data")

      const mockGifs = [
        {
          _id: "mock1",
          clipNo: "Clip01",
          movieName: "Mock Movie 1",
          artist: "Actor 1",
          characterNames: "Character 1",
          mood: "Happy",
          transcript: "This is a happy moment",
          property: "None",
          place: "Studio",
          clipDuration: "0:03",
          clipLink: "/joyful-celebration.png",
          clipThumbnailUrl: "/colorful-celebration.png",
        },
        {
          _id: "mock2",
          clipNo: "Clip02",
          movieName: "Mock Movie 2",
          artist: "Actor 2",
          characterNames: "Character 2",
          mood: "Sad",
          transcript: "This is a sad moment",
          property: "None",
          place: "Outside",
          clipDuration: "0:04",
          clipLink: "/lonely-rainy-window.png",
          clipThumbnailUrl: "/heartbroken-rain.png",
        },
      ]

      return NextResponse.json({
        success: true,
        data: {
          gifs: mockGifs,
          total: mockGifs.length,
          page,
          limit,
          pages: 1,
        },
      })
    }

    // Return media items with pagination info
    return NextResponse.json({
      success: true,
      data: {
        gifs,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error in GIF filter API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to filter GIFs",
        error: error.message,
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
