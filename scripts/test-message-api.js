import fetch from "node-fetch"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// API base URL - change this to your API URL
const API_BASE_URL = "http://localhost:3000"

async function testMessageAPI() {
  try {
    console.log("Testing Message API...")

    // Get token (you might need to login first)
    const token = process.env.TEST_TOKEN || "your-test-token"

    // Test data
    const messageData = {
      conversationId: "65a123456789abcdef123456", // Replace with a valid conversation ID or it will create one
      senderId: "testuser1",
      receiverId: "testuser2",
      message: "Hello, this is a test message!",
      members: ["testuser1", "testuser2"],
      clipThumbnailUrl: "https://example.com/thumbnail.jpg",
      clipLink: "https://example.com/clip.mp4",
    }

    // Send POST request to create a message
    console.log("Sending message:", messageData)
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    })

    const data = await response.json()

    if (response.ok) {
      console.log("Message created successfully!")
      console.log("Response:", data)

      // Test GET request to retrieve messages
      console.log("\nRetrieving messages for conversation...")
      const getResponse = await fetch(`${API_BASE_URL}/api/messages?conversationId=${messageData.conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const messages = await getResponse.json()
      console.log("Retrieved messages:", messages)
    } else {
      console.error("Failed to create message:", data)
    }
  } catch (error) {
    console.error("Error testing message API:", error)
  }
}

// Run the test
testMessageAPI()
