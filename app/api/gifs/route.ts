import { NextResponse } from "next/server"

// Define the GIF interface
interface Gif {
  id: string
  url: string
  preview: string
  title: string
  moods: string[]
}

// Mock GIF data with mood information
const mockGifs: Gif[] = [
  {
    id: "1",
    url: "/joyful-celebration.png",
    preview: "/joyful-celebration.png",
    title: "Celebration",
    moods: ["happy", "excited", "celebration"],
  },
  {
    id: "2",
    url: "/colorful-celebration.png",
    preview: "/colorful-celebration.png",
    title: "Party",
    moods: ["happy", "party", "fun"],
  },
  {
    id: "3",
    url: "/joyful-dance-party.png",
    preview: "/joyful-dance-party.png",
    title: "Dancing",
    moods: ["happy", "dancing", "energetic"],
  },
  {
    id: "4",
    url: "/joyful-laughter.png",
    preview: "/joyful-laughter.png",
    title: "Laughing",
    moods: ["happy", "laughing", "amused"],
  },
  {
    id: "5",
    url: "/cheerful-approval.png",
    preview: "/cheerful-approval.png",
    title: "Thumbs Up",
    moods: ["approval", "positive", "agreement"],
  },
  {
    id: "6",
    url: "/startled-cat-fall.png",
    preview: "/startled-cat-fall.png",
    title: "Surprised Cat",
    moods: ["surprised", "funny", "shocked"],
  },
  {
    id: "7",
    url: "/lonely-rainy-window.png",
    preview: "/lonely-rainy-window.png",
    title: "Rainy Day",
    moods: ["sad", "lonely", "melancholy"],
  },
  {
    id: "8",
    url: "/heartbroken-rain.png",
    preview: "/heartbroken-rain.png",
    title: "Heartbreak",
    moods: ["sad", "heartbroken", "emotional"],
  },
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    let filteredGifs = [...mockGifs]

    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredGifs = mockGifs.filter(
        (gif) =>
          gif.title.toLowerCase().includes(lowerQuery) ||
          gif.moods.some((mood) => mood.toLowerCase().includes(lowerQuery)),
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredGifs,
    })
  } catch (error) {
    console.error("Error fetching GIFs:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch GIFs",
      },
      { status: 500 },
    )
  }
}
