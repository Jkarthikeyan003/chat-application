"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Clear token cookie
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict"

    // Show logout message
    alert("You have been logged out")

    // Redirect to login page
    router.push("/")
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      aria-label="Logout"
    >
      <LogOut size={18} />
      <span>Logout</span>
    </button>
  )
}
