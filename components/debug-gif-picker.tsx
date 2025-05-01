"use client"

import { useState, useEffect } from "react"
import ApiGifPicker from "./api-gif-picker"

export default function DebugGifPicker() {
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error">("loading")
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function testMediaApi() {
      try {
        setApiStatus("loading")

        const response = await fetch("/api/media?page=1&limit=5")
        const data = await response.json()

        setApiResponse(data)

        if (response.ok && data.success) {
          setApiStatus("success")
        } else {
          setApiStatus("error")
          setErrorMessage(data.message || "Unknown error")
        }
      } catch (error) {
        setApiStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      }
    }

    testMediaApi()
  }, [])

  const handleGifSelect = (gifUrl: string, thumbnailUrl: string) => {
    alert(`Selected GIF: ${gifUrl}\nThumbnail: ${thumbnailUrl}`)
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">GIF Picker Debug</h2>

      <div className="mb-4">
        <h3 className="font-bold">API Status:</h3>
        <div
          className={`p-2 rounded ${
            apiStatus === "loading" ? "bg-yellow-100" : apiStatus === "success" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {apiStatus === "loading" ? "Loading..." : apiStatus === "success" ? "Success" : `Error: ${errorMessage}`}
        </div>
      </div>

      {apiStatus === "success" && (
        <div className="mb-4">
          <h3 className="font-bold">API Response:</h3>
          <div className="p-2 bg-gray-100 rounded overflow-auto max-h-40">
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-bold">Test GIF Picker:</h3>
        <div className="border rounded p-2">
          <ApiGifPicker onGifSelect={handleGifSelect} />
        </div>
      </div>
    </div>
  )
}
