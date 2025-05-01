import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    // Log that we're using cached connection
    console.log("Using cached MongoDB connection")
    return { client: cachedClient, db: cachedDb }
  }

  // Create a new client and connect
  console.log("Creating new MongoDB connection")
  console.log(`Using connection string: ${MONGODB_URI.substring(0, 10)}...`)

  try {
    const client = new MongoClient(MONGODB_URI!)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    // Get database name from connection string or use default
    let dbName = "chat-app"
    try {
      // Extract database name from connection string if possible
      if (MONGODB_URI.includes("mongodb://") || MONGODB_URI.includes("mongodb+srv://")) {
        const url = new URL(MONGODB_URI.replace("mongodb://", "http://").replace("mongodb+srv://", "http://"))
        if (url.pathname && url.pathname.length > 1) {
          dbName = url.pathname.substring(1)
        }
      }
    } catch (error) {
      console.warn("Could not parse database name from URI, using default")
    }

    console.log(`Using database: ${dbName}`)
    const db = client.db(dbName)

    // Test the connection by getting the collections
    const collections = await db.listCollections().toArray()
    console.log(`Found ${collections.length} collections in database`)

    // Cache the client and db for reuse
    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`)
  }
}
