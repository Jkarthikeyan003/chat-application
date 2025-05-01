import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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

    // Get all available tags from the media collection
    const allMedia = await db.collection("media").find({ type: "gif" }).toArray()
    const allTags = Array.from(new Set(allMedia.flatMap((item) => item.tags || [])))

    // Use OpenAI to suggest relevant tags based on the message
    const prompt = `
      Given a message in a chat conversation, suggest 3-5 tags that would be appropriate for GIFs to reply with.
      Choose from these available tags: ${allTags.join(", ")}
      
      Message: "${messageText}"
      
      Return only the tags as a comma-separated list, nothing else.
    `

    const { text: suggestedTagsText } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    // Parse the suggested tags
    const suggestedTags = suggestedTagsText
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

    // Find GIFs with the suggested tags
    const gifs = await db
      .collection("media")
      .find({
        type: "gif",
        tags: { $in: suggestedTags },
      })
      .limit(limit)
      .toArray()

    // If we don't have enough GIFs, get some random ones
    if (gifs.length < limit) {
      const additionalGifs = await db
        .collection("media")
        .find({
          type: "gif",
          _id: { $nin: gifs.map((gif) => gif._id) },
        })
        .limit(limit - gifs.length)
        .toArray()

      gifs.push(...additionalGifs)
    }

    // Format the GIFs for the response
    const formattedGifs = gifs.map((gif) => ({
      _id: gif._id.toString(),
      id: gif._id.toString(),
      title: gif.title || "Untitled GIF",
      url: gif.clipLink || gif.url,
      clipLink: gif.clipLink,
      clipThumbnailUrl: gif.clipThumbnailUrl,
      thumbnailUrl: gif.thumbnailUrl,
      tags: gif.tags || [],
      mood: gif.tags?.[0] || "general",
    }))

    return NextResponse.json({
      success: true,
      data: {
        gifs: formattedGifs,
        suggestedTags,
      },
    })
  } catch (error) {
    console.error("Error in AI GIF filter:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to filter GIFs with AI",
      },
      { status: 500 },
    )
  }
}
