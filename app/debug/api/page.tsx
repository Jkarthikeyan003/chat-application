"use client"

import type React from "react"

import { useState, useEffect } from "react"

// Define proper types for the endpoints
interface Endpoint {
  path: string
  methods: string[]
  description: string
  params?: string[]
  body?: Record<string, any>
}

export default function ApiDebugPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [params, setParams] = useState<Record<string, string>>({})
  const [body, setBody] = useState("")
  const [token, setToken] = useState("")

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
    }

    // Fetch available endpoints
    const fetchEndpoints = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/debug/endpoints")
        if (!response.ok) {
          throw new Error(`Failed to fetch endpoints: ${response.status}`)
        }
        const data = await response.json()
        if (data.success) {
          setEndpoints(data.data.endpoints)
        } else {
          throw new Error(data.message || "Failed to fetch endpoints")
        }
      } catch (err) {
        console.error("Error fetching endpoints:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchEndpoints()
  }, [])

  const handleEndpointSelect = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint)
    setTestResult(null)

    // Initialize params based on endpoint
    const initialParams: Record<string, string> = {}
    if (endpoint.params) {
      endpoint.params.forEach((param) => {
        initialParams[param] = ""
      })
    }
    setParams(initialParams)

    // Initialize body if it's a POST endpoint
    if (endpoint.methods.includes("POST")) {
      if (endpoint.body) {
        setBody(JSON.stringify(endpoint.body, null, 2))
      } else {
        setBody("{}")
      }
    } else {
      setBody("")
    }
  }

  const handleParamChange = (param: string, value: string) => {
    setParams((prev) => ({
      ...prev,
      [param]: value,
    }))
  }

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value)
  }

  const handleTestEndpoint = async () => {
    if (!selectedEndpoint) return

    try {
      setTestLoading(true)
      setTestResult(null)

      // Build URL with params
      let url = selectedEndpoint.path
      if (url.includes("[id]")) {
        url = url.replace("[id]", params.id || "invalid-id")
      }

      // Add query params
      const queryParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value && !url.includes(`[${key}]`)) {
          queryParams.append(key, value)
        }
      }

      const queryString = queryParams.toString()
      if (queryString) {
        url = `${url}?${queryString}`
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Make request
      const method = selectedEndpoint.methods[0] // Use first method
      const options: RequestInit = {
        method,
        headers,
      }

      if (method === "POST" && body) {
        options.body = body
      }

      console.log(`Testing endpoint: ${url}`, options)
      const response = await fetch(url, options)
      const data = await response.json()

      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data,
      })
    } catch (err) {
      console.error("Error testing endpoint:", err)
      setTestResult({
        error: err instanceof Error ? err.message : "An error occurred",
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">API Debug Tool</h1>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded text-red-700">
          <p>Error: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h2 className="text-lg font-semibold mb-3">Available Endpoints</h2>
            <div className="bg-gray-100 p-4 rounded">
              <ul className="space-y-2">
                {endpoints.map((endpoint, index) => (
                  <li key={index}>
                    <button
                      className={`w-full text-left p-2 rounded ${
                        selectedEndpoint === endpoint ? "bg-blue-100 border-l-4 border-blue-500" : "hover:bg-gray-200"
                      }`}
                      onClick={() => handleEndpointSelect(endpoint)}
                    >
                      <div className="font-medium">{endpoint.path}</div>
                      <div className="text-sm text-gray-600">
                        {endpoint.methods.join(", ")} - {endpoint.description}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedEndpoint ? (
              <div>
                <h2 className="text-lg font-semibold mb-3">Test Endpoint: {selectedEndpoint.path}</h2>

                <div className="bg-white border rounded p-4 mb-4">
                  <h3 className="font-medium mb-2">Authentication</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Bearer Token</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm font-mono"
                      value={token}
                      onChange={handleTokenChange}
                      placeholder="JWT token"
                    />
                  </div>

                  {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Parameters</h3>
                      {selectedEndpoint.params.map((param) => (
                        <div key={param} className="mb-2">
                          <label className="block text-sm font-medium mb-1">{param}</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={params[param] || ""}
                            onChange={(e) => handleParamChange(param, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedEndpoint.methods.includes("POST") && (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Request Body (JSON)</h3>
                      <textarea
                        className="w-full p-2 border rounded font-mono text-sm h-40"
                        value={body}
                        onChange={handleBodyChange}
                      />
                    </div>
                  )}

                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleTestEndpoint}
                    disabled={testLoading}
                  >
                    {testLoading ? "Testing..." : "Test Endpoint"}
                  </button>
                </div>

                {testResult && (
                  <div className="bg-white border rounded p-4">
                    <h3 className="font-medium mb-2">Test Result</h3>
                    {testResult.error ? (
                      <div className="bg-red-100 p-3 rounded text-red-700">
                        <p>Error: {testResult.error}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2">
                          <span className="font-medium">Status:</span>{" "}
                          <span
                            className={
                              testResult.status >= 200 && testResult.status < 300 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {testResult.status} {testResult.statusText}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Response:</span>
                          <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-80 text-sm">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p>Select an endpoint from the list to test it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
