import fetch from "node-fetch"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// API base URL - change this to your API URL
const API_BASE_URL = "http://localhost:3000"

async function testMediaAPI() {
  try {
    console.log("Testing Media API...")

    // Test 1: Get all media with pagination
    console.log("\n1. Getting all media (page 1, limit 5)...")
    const allMediaResponse = await fetch(`${API_BASE_URL}/api/media?page=1&limit=5`)

    const allMediaResult = await allMediaResponse.json()

    if (allMediaResponse.ok) {
      console.log("Media retrieved successfully!")
      console.log("Pagination info:", allMediaResult.data.pagination)
      console.log(`Retrieved ${allMediaResult.data.items.length} items`)

      // Display first 2 items
      allMediaResult.data.items.slice(0, 2).forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`)
        console.log(`- Movie: ${item.movieName}`)
        console.log(`- Transcript: ${item.transcript}`)
        console.log(`- Thumbnail: ${item.clipThumbnailUrl}`)
      })
    } else {
      console.error("Failed to retrieve media:", allMediaResult)
    }
  } catch (error) {
    console.error("Error testing media API:", error)
  }
}

// Run the test
testMediaAPI()
