"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  startSession,
  endSession,
  trackScreenEnter,
  trackError,
} from "@/lib/tracking"

interface TrackingProviderProps {
  children: React.ReactNode
}

/**
 * TrackingProvider manages session lifecycle and automatic page tracking.
 *
 * - Starts a session when the app loads
 * - Ends the session when the user leaves (beforeunload)
 * - Tracks page views with screen time on route changes
 * - Captures global errors for tracking
 */
export function TrackingProvider({ children }: TrackingProviderProps) {
  const pathname = usePathname()
  const hasInitialized = useRef(false)

  // Initialize session on mount
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    startSession()

    // End session on page unload
    const handleUnload = () => {
      endSession()
    }

    // Track visibility changes (user switching tabs)
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Could track tab switch here if needed
      }
    }

    // Capture global errors
    const handleError = (event: ErrorEvent) => {
      trackError(event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    }

    window.addEventListener("beforeunload", handleUnload)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("beforeunload", handleUnload)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("error", handleError)
    }
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      trackScreenEnter(pathname)
    }
  }, [pathname])

  return <>{children}</>
}
