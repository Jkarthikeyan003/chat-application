"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface GifModalProps {
  gifUrl: string
  isOpen: boolean
  onClose: () => void
}

export default function GifModal({ gifUrl, isOpen, onClose }: GifModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.addEventListener("mousedown", handleClickOutside)
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"

      // Auto-play the video when modal opens
      if (videoRef.current) {
        videoRef.current.play().catch((err) => console.error("Could not play video:", err))
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Check if the URL is a video (mp4, etc.) or an image
  const isVideo = gifUrl.match(/\.(mp4|webm|ogg)($|\?)/i)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div ref={modalRef} className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center justify-center w-full h-full p-4">
          {isVideo ? (
            <video
              ref={videoRef}
              src={gifUrl}
              controls
              autoPlay
              loop
              className="max-w-full max-h-[80vh] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img src={gifUrl || "/placeholder.svg"} alt="GIF" className="max-w-full max-h-[80vh] object-contain" />
          )}
        </div>
      </div>
    </div>
  )
}
