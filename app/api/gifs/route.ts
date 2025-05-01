import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 60 // Default to 60 items

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Build the query for the media collection
    let dbQuery: any = { type: "gif" } // Filter by type "gif"

    if (query) {
      const lowerQuery = query.toLowerCase()
      // Search in all the requested fields
      dbQuery = {
        $and: [
          { type: "gif" },
          {
            $or: [
              { title: { $regex: lowerQuery, $options: "i" } },
              { description: { $regex: lowerQuery, $options: "i" } },
              { tags: { $in: [new RegExp(lowerQuery, "i")] } },
              { movieName: { $regex: lowerQuery, $options: "i" } },
              { artist: { $regex: lowerQuery, $options: "i" } },
              { characterNames: { $in: [new RegExp(lowerQuery, "i")] } },
              { mood: { $regex: lowerQuery, $options: "i" } },
              { transcript: { $regex: lowerQuery, $options: "i" } },
              { property: { $regex: lowerQuery, $options: "i" } },
              { place: { $regex: lowerQuery, $options: "i" } },
            ],
          },
        ],
      }
    }

    console.log("Fetching GIFs with query:", JSON.stringify(dbQuery))

    // Fetch GIFs from the media collection
    const gifs = await db.collection("media").find(dbQuery).limit(limit).toArray()

    console.log(`Found ${gifs.length} GIFs in media collection`)

    // Transform the data to match our expected format
    const formattedGifs = gifs.map((gif) => ({
      _id: gif._id.toString(),
      id: gif._id.toString(),
      title: gif.title || "Untitled GIF",
      url: gif.url || gif.clipLink,
      clipLink: gif.url || gif.clipLink,
      preview: gif.thumbnailUrl || gif.clipThumbnailUrl,
      clipThumbnailUrl: gif.thumbnailUrl || gif.clipThumbnailUrl,
      tags: gif.tags || [],
      moods: gif.tags || [],
      // Include all the new fields
      movieName: gif.movieName || "",
      artist: gif.artist || "",
      characterNames: gif.characterNames || [],
      mood: gif.mood || "",
      transcript: gif.transcript || "",
      property: gif.property || "",
      place: gif.place || "",
      createdAt: gif.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedGifs,
    })
  } catch (error) {
    console.error("Error fetching GIFs from media collection:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch GIFs from media collection",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
