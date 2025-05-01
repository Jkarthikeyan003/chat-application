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

async function seedMedia() {
  let client

  try {
    console.log("Connecting to MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log("Connected to MongoDB successfully")

    const db = client.db()
    const mediaCollection = db.collection("media")

    // Check if media already exist
    const existingMedia = await mediaCollection.countDocuments()
    if (existingMedia > 0) {
      console.log(`Found ${existingMedia} existing media items. Skipping seed.`)
      console.log("To force re-seed, delete existing media first.")
      return
    }

    // Sample media data based on the provided example
    const mediaItems = [
      {
        clipNo: "Clip01",
        movieName: "Anger Management",
        artist: "Adam Sandler, Isaac C. Singleton Jr, Nancy Carell",
        characterNames: "Dave Buznik, Air Marshall, Flight Attendant",
        mood: "Frustrated, Sad, Negative",
        transcript: "Calm Down, I'm Calm",
        property: "Stun Gun",
        place: "Flight",
        clipDuration: "0:03",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip01.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip01.png",
      },
      {
        clipNo: "Clip02",
        movieName: "The Dark Knight",
        artist: "Heath Ledger, Christian Bale",
        characterNames: "Joker, Batman",
        mood: "Intense, Chaotic, Dark",
        transcript: "Why So Serious?",
        property: "Playing Card",
        place: "Gotham City",
        clipDuration: "0:04",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip02.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip02.png",
      },
      {
        clipNo: "Clip03",
        movieName: "The Avengers",
        artist: "Robert Downey Jr., Mark Ruffalo",
        characterNames: "Tony Stark, Bruce Banner",
        mood: "Humorous, Witty, Positive",
        transcript: "That's my secret, I'm always angry",
        property: "Stark Tech",
        place: "Helicarrier",
        clipDuration: "0:05",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip03.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip03.png",
      },
      {
        clipNo: "Clip04",
        movieName: "Pulp Fiction",
        artist: "Samuel L. Jackson, John Travolta",
        characterNames: "Jules Winnfield, Vincent Vega",
        mood: "Intense, Threatening, Serious",
        transcript: "Say what again!",
        property: "Gun",
        place: "Apartment",
        clipDuration: "0:06",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip04.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip04.png",
      },
      {
        clipNo: "Clip05",
        movieName: "The Princess Bride",
        artist: "Mandy Patinkin",
        characterNames: "Inigo Montoya",
        mood: "Determined, Vengeful, Serious",
        transcript: "You killed my father, prepare to die",
        property: "Sword",
        place: "Castle",
        clipDuration: "0:04",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip05.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip05.png",
      },
      {
        clipNo: "Clip06",
        movieName: "Forrest Gump",
        artist: "Tom Hanks",
        characterNames: "Forrest Gump",
        mood: "Inspirational, Positive, Reflective",
        transcript: "Life is like a box of chocolates",
        property: "Bench",
        place: "Park",
        clipDuration: "0:05",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip06.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip06.png",
      },
      {
        clipNo: "Clip07",
        movieName: "The Godfather",
        artist: "Marlon Brando",
        characterNames: "Don Vito Corleone",
        mood: "Threatening, Serious, Powerful",
        transcript: "I'm gonna make him an offer he can't refuse",
        property: "Cat",
        place: "Office",
        clipDuration: "0:04",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip07.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip07.png",
      },
      {
        clipNo: "Clip08",
        movieName: "Titanic",
        artist: "Leonardo DiCaprio, Kate Winslet",
        characterNames: "Jack Dawson, Rose DeWitt Bukater",
        mood: "Romantic, Joyful, Exhilarating",
        transcript: "I'm the king of the world!",
        property: "Ship",
        place: "Ocean",
        clipDuration: "0:03",
        clipLink: "https://media-hosting.imagekit.io/d69db296726f42c6/Clip08.mp4",
        clipThumbnailUrl: "https://media-hosting.imagekit.io/39e97a359ae9403c/Clip08.png",
      },
    ]

    console.log("Inserting media items into database...")
    const result = await mediaCollection.insertMany(mediaItems)

    console.log(`Successfully inserted ${result.insertedCount} media items`)
  } catch (error) {
    console.error("Error seeding media:", error)
    console.error("Details:", error.message)
  } finally {
    if (client) {
      await client.close()
      console.log("MongoDB connection closed")
    }
  }
}

// Run the seed function
seedMedia()
