/**
 * Debug utility for browser console
 * @param message Debug message
 * @param data Optional data to log
 */
export function browserDebug(message: string, data?: any): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.group(`🔍 ${message}`)
    if (data !== undefined) {
      console.log(data)
    }
    console.groupEnd()
  }
}

/**
 * Server-side debug utility
 * @param message Debug message
 * @param data Optional data to log
 */
export function serverDebug(message: string, data?: any): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[SERVER] 🔍 ${message}`)
    if (data !== undefined) {
      console.log(data)
    }
  }
}
