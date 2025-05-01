import fetch from "node-fetch"

// API base URL - change this to your NestJS backend URL
const API_BASE_URL = "http://localhost:3001"

async function seedGifs() {
  try {
    console.log("Seeding GIFs...")

    const response = await fetch(`${API_BASE_URL}/media/seed-gifs`, {
      method: "POST",
    })

    const data = await response.json()
    console.log("Seed result:", data)
  } catch (error) {
    console.error("Error seeding GIFs:", error)
  }
}

seedGifs()
