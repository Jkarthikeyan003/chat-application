import { MongoClient } from "mongodb"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set")
  process.exit(1)
}

async function checkMedia() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const mediaCollection = db.collection("media")

    // Count media items
    const mediaCount = await mediaCollection.countDocuments()
    console.log(`Total media items in database: ${mediaCount}`)

    if (mediaCount === 0) {
      console.log("\nNo media items found in the database.")
      console.log("Please ensure your media collection has been populated.")
      return
    }

    // Get a sample of media items
    const mediaSample = await mediaCollection.find().limit(5).toArray()

    console.log("\nSample media items in database:")
    mediaSample.forEach((item, index) => {
      console.log(`\n--- Media Item ${index + 1} ---`)
      console.log(`Clip No: ${item.clipNo}`)
      console.log(`Movie: ${item.movieName}`)
      console.log(`Transcript: ${item.transcript}`)
      console.log(`Artist: ${item.artist}`)
      console.log(`Thumbnail URL: ${item.clipThumbnailUrl}`)
      console.log(`Clip URL: ${item.clipLink}`)
    })

    // Show available search fields
    const searchFields = ["movieName", "artist", "characterNames", "mood", "transcript", "property", "place"]

    console.log("\nAvailable search fields:")
    searchFields.forEach((field) => {
      console.log(`- ${field}`)
    })
  } catch (error) {
    console.error("Error checking media:", error)
    console.error("Details:", error.message)
  } finally {
    if (client) {
      await client.close()
      console.log("\nMongoDB connection closed")
    }
  }
}

// Run the check function
checkMedia()
