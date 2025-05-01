import fetch from "node-fetch"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// API base URL - change this to your API URL
const API_BASE_URL = "http://localhost:3000"

async function testMessageEndpoints() {
  try {
    console.log("Testing Message Endpoints...")

    // Get token (you might need to login first)
    const token = process.env.TEST_TOKEN || "your-test-token"

    // Test data
    const senderId = "testuser1"
    const receiverId = "testuser2"

    // Step 1: Send a message
    console.log("\n1. Sending a new message...")
    const messageData = {
      senderId,
      receiverId,
      message: `Test message ${new Date().toISOString()}`,
      members: [senderId, receiverId],
      clipThumbnailUrl: "https://example.com/thumbnail.jpg",
      clipLink: "https://example.com/clip.mp4",
    }

    const sendResponse = await fetch(`${API_BASE_URL}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    })

    const sendResult = await sendResponse.json()

    if (sendResponse.ok) {
      console.log("Message sent successfully!")
      console.log("Response:", sendResult)

      const conversationId = sendResult.data.conversationId

      // Step 2: Send a few more messages to test pagination
      console.log("\n2. Sending additional messages for pagination testing...")

      for (let i = 0; i < 5; i++) {
        await fetch(`${API_BASE_URL}/api/messages/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversationId,
            senderId: i % 2 === 0 ? senderId : receiverId,
            receiverId: i % 2 === 0 ? receiverId : senderId,
            message: `Pagination test message ${i + 1}`,
            members: [senderId, receiverId],
          }),
        })
        console.log(`Message ${i + 1} sent`)
      }

      // Step 3: List messages with pagination
      console.log("\n3. Listing messages with pagination...")

      const listResponse = await fetch(
        `${API_BASE_URL}/api/messages/list?conversationId=${conversationId}&page=1&limit=3&userId=${receiverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const listResult = await listResponse.json()

      if (listResponse.ok) {
        console.log("Messages retrieved successfully!")
        console.log("Pagination info:", listResult.data.pagination)
        console.log(`Retrieved ${listResult.data.messages.length} messages:`)

        listResult.data.messages.forEach((msg, index) => {
          console.log(`${index + 1}. From: ${msg.senderId}, Message: ${msg.message}, Date: ${msg.createdAt}`)
        })

        // Step 4: Get second page of messages
        if (listResult.data.pagination.hasNextPage) {
          console.log("\n4. Getting second page of messages...")

          const page2Response = await fetch(
            `${API_BASE_URL}/api/messages/list?conversationId=${conversationId}&page=2&limit=3`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

          const page2Result = await page2Response.json()

          if (page2Response.ok) {
            console.log("Second page retrieved successfully!")
            console.log("Pagination info:", page2Result.data.pagination)
            console.log(`Retrieved ${page2Result.data.messages.length} messages:`)

            page2Result.data.messages.forEach((msg, index) => {
              console.log(`${index + 1}. From: ${msg.senderId}, Message: ${msg.message}, Date: ${msg.createdAt}`)
            })
          } else {
            console.error("Failed to retrieve second page:", page2Result)
          }
        }
      } else {
        console.error("Failed to retrieve messages:", listResult)
      }
    } else {
      console.error("Failed to send message:", sendResult)
    }
  } catch (error) {
    console.error("Error testing message endpoints:", error)
  }
}

// Run the test
testMessageEndpoints()
