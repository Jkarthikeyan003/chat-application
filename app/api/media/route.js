import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getPaginationParams } from "@/lib/pagination"
import jwt from "jsonwebtoken"

// JWT secret for verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key-change-this-in-production"

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")

    // For media endpoint, we'll make authentication optional
    // This allows the GIF picker to work even if the user isn't fully authenticated
    let isAuthenticated = false

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      try {
        const decodedToken = jwt.verify(token, JWT_SECRET) 
        isAuthenticated = true
      } catch (error) {
        console.warn("Invalid token provided, but continuing as unauthenticated")
      }
    }

    const url = new URL(request.url)

    // Get pagination parameters
    const { page, limit, skip } = getPaginationParams({
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "20",
      defaultLimit: 20,
    })

    // Get search parameters
    const searchParams = {
      search: url.searchParams.get("search") || undefined,
      movieName: url.searchParams.get("movieName") || undefined,
      artist: url.searchParams.get("artist") || undefined,
      characterNames: url.searchParams.get("characterNames") || undefined,
      mood: url.searchParams.get("mood") || undefined,
      transcript: url.searchParams.get("transcript") || undefined,
      property: url.searchParams.get("property") || undefined,
      place: url.searchParams.get("place") || undefined,
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()
    const mediaCollection = db.collection("media")

    // Build the filter based on search parameters
    const filter = {}

    // Handle general search across multiple fields
    if (searchParams.search) {
      filter.$or = [
        { movieName: { $regex: searchParams.search, $options: "i" } },
        { artist: { $regex: searchParams.search, $options: "i" } },
        { characterNames: { $regex: searchParams.search, $options: "i" } },
        { mood: { $regex: searchParams.search, $options: "i" } },
        { transcript: { $regex: searchParams.search, $options: "i" } },
        { property: { $regex: searchParams.search, $options: "i" } },
        { place: { $regex: searchParams.search, $options: "i" } },
      ]
    }

    // Handle specific field searches
    if (searchParams.movieName) {
      filter.movieName = { $regex: searchParams.movieName, $options: "i" }
    }
    if (searchParams.artist) {
      filter.artist = { $regex: searchParams.artist, $options: "i" }
    }
    if (searchParams.characterNames) {
      filter.characterNames = { $regex: searchParams.characterNames, $options: "i" }
    }
    if (searchParams.mood) {
      filter.mood = { $regex: searchParams.mood, $options: "i" }
    }
    if (searchParams.transcript) {
      filter.transcript = { $regex: searchParams.transcript, $options: "i" }
    }
    if (searchParams.property) {
      filter.property = { $regex: searchParams.property, $options: "i" }
    }
    if (searchParams.place) {
      filter.place = { $regex: searchParams.place, $options: "i" }
    }

    // Get total count for pagination
    const totalCount = await mediaCollection.countDocuments(filter)
    const totalPages = Math.ceil(totalCount / limit)

    // Get media items with pagination
    const mediaItems = await mediaCollection
      .find(filter)
      .sort({ clipNo: 1 }) // Sort by clipNo, you can change this as needed
      .skip(skip)
      .limit(limit)
      .toArray()

    // Return media items with pagination info
    return NextResponse.json({
      success: true,
      data: {
        items: mediaItems,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error retrieving media:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve media" }, { status: 500 })
  }
}
