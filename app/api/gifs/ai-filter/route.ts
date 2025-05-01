import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { OpenAI } from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messageText, limit = 8 } = body

    if (!messageText) {
      return NextResponse.json(
        {
          success: false,
          message: "Message text is required",
        },
        { status: 400 },
      )
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Get all available GIFs from the media collection
    const allGifs = await db.collection("media").find({ type: "gif" }).limit(100).toArray()

    // Extract all available tags, moods, movie names, characters, etc. from the GIFs
    const allTags = new Set<string>()
    const allMovies = new Set<string>()
    const allCharacters = new Set<string>()
    const allMoods = new Set<string>()
    const allPlaces = new Set<string>()

    allGifs.forEach((gif) => {
      if (gif.tags && Array.isArray(gif.tags)) {
        gif.tags.forEach((tag: string) => allTags.add(tag))
      }
      if (gif.mood) allMoods.add(gif.mood)
      if (gif.movieName) allMovies.add(gif.movieName)
      if (gif.place) allPlaces.add(gif.place)
      if (gif.characterNames && Array.isArray(gif.characterNames)) {
        gif.characterNames.forEach((character: string) => allCharacters.add(character))
      }
    })

    // Convert sets to arrays
    const tagsArray = Array.from(allTags)
    const moviesArray = Array.from(allMovies)
    const charactersArray = Array.from(allCharacters)
    const moodsArray = Array.from(allMoods)
    const placesArray = Array.from(allPlaces)

    // Use OpenAI to analyze the message and suggest relevant tags, movies, characters, etc.
    const prompt = `
      Given the following message: "${messageText}"
      
      Please analyze the message and identify the most relevant items from the following categories that would match the message's context, emotion, or content:
      
      1. Tags: ${tagsArray.join(", ")}
      2. Movies: ${moviesArray.join(", ")}
      3. Characters: ${charactersArray.join(", ")}
      4. Moods: ${moodsArray.join(", ")}
      5. Places: ${placesArray.join(", ")}
      
      Return your response as a JSON object with the following structure:
      {
        "tags": ["tag1", "tag2"],
        "movies": ["movie1", "movie2"],
        "characters": ["character1", "character2"],
        "moods": ["mood1", "mood2"],
        "places": ["place1", "place2"]
      }
      
      Include only the most relevant items (up to 3 for each category) that best match the message.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const responseContent = completion.choices[0].message.content
    let parsedResponse

    try {
      parsedResponse = JSON.parse(responseContent || "{}")
    } catch (error) {
      console.error("Error parsing OpenAI response:", error)
      parsedResponse = {
        tags: [],
        movies: [],
        characters: [],
        moods: [],
        places: [],
      }
    }

    // Build a query to find GIFs that match the suggested tags, movies, characters, etc.
    const orConditions = []

    if (parsedResponse.tags && parsedResponse.tags.length > 0) {
      orConditions.push({ tags: { $in: parsedResponse.tags } })
    }

    if (parsedResponse.movies && parsedResponse.movies.length > 0) {
      orConditions.push({ movieName: { $in: parsedResponse.movies } })
    }

    if (parsedResponse.characters && parsedResponse.characters.length > 0) {
      orConditions.push({ characterNames: { $in: parsedResponse.characters } })
    }

    if (parsedResponse.moods && parsedResponse.moods.length > 0) {
      orConditions.push({ mood: { $in: parsedResponse.moods } })
    }

    if (parsedResponse.places && parsedResponse.places.length > 0) {
      orConditions.push({ place: { $in: parsedResponse.places } })
    }

    let query = { type: "gif" }
    if (orConditions.length > 0) {
      query = {
        $and: [{ type: "gif" }, { $or: orConditions }],
      }
    }

    console.log("AI Filter Query:", JSON.stringify(query))

    // Find matching GIFs
    const matchingGifs = await db.collection("media").find(query).limit(limit).toArray()

    console.log(`Found ${matchingGifs.length} matching GIFs`)

    // If we don't have enough matching GIFs, get some random ones to fill the quota
    let finalGifs = [...matchingGifs]
    if (finalGifs.length < limit) {
      const remainingCount = limit - finalGifs.length
      const existingIds = new Set(finalGifs.map((gif) => gif._id.toString()))

      const randomGifs = await db
        .collection("media")
        .find({
          type: "gif",
          _id: { $nin: Array.from(existingIds).map((id) => new Object(id)) },
        })
        .limit(remainingCount)
        .toArray()

      finalGifs = [...finalGifs, ...randomGifs]
    }

    // Transform the data to match our expected format
    const formattedGifs = finalGifs.map((gif) => ({
      _id: gif._id.toString(),
      id: gif._id.toString(),
      title: gif.title || "Untitled GIF",
      url: gif.url || gif.clipLink,
      clipLink: gif.url || gif.clipLink,
      preview: gif.thumbnailUrl || gif.clipThumbnailUrl,
      clipThumbnailUrl: gif.thumbnailUrl || gif.clipThumbnailUrl,
      tags: gif.tags || [],
      moods: gif.tags || [],
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
      data: {
        gifs: formattedGifs,
        analysis: parsedResponse,
      },
    })
  } catch (error) {
    console.error("Error in AI GIF filter:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to filter GIFs with AI",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
