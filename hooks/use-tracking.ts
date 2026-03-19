"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  trackScreenEnter,
  trackClick,
  trackFormSubmit,
  trackNavigation,
  trackExport,
  trackFilterChange,
  track,
} from "@/lib/tracking"

/**
 * Hook for tracking user interactions
 *
 * Usage:
 * ```tsx
 * const { trackAction, trackForm } = useTracking()
 *
 * // Track button click
 * <Button onClick={() => { trackAction("export_csv"); handleExport() }}>
 *   Export
 * </Button>
 *
 * // Track form submission
 * const onSubmit = async (data) => {
 *   try {
 *     await save(data)
 *     trackForm("edit_params", true)
 *   } catch {
 *     trackForm("edit_params", false)
 *   }
 * }
 * ```
 */
export function useTracking() {
  const pathname = usePathname()

  // Track page views automatically with screen time
  useEffect(() => {
    if (pathname) {
      trackScreenEnter(pathname)
    }
  }, [pathname])

  return {
    /**
     * Track a user action (button click, menu selection, etc.)
     */
    trackAction: (action: string, label?: string, metadata?: Record<string, unknown>) => {
      trackClick(action, label, metadata)
    },

    /**
     * Track form submission with success/failure
     */
    trackForm: (formName: string, success: boolean, metadata?: Record<string, unknown>) => {
      trackFormSubmit(formName, success, metadata)
    },

    /**
     * Track navigation between screens
     */
    trackNav: (from: string, to: string) => {
      trackNavigation(from, to)
    },

    /**
     * Track export action (CSV, PDF, etc.)
     */
    trackExportAction: (exportType: string, count?: number, metadata?: Record<string, unknown>) => {
      trackExport(exportType, count, metadata)
    },

    /**
     * Track filter changes
     */
    trackFilter: (filterName: string, value: string | number, metadata?: Record<string, unknown>) => {
      trackFilterChange(filterName, value, metadata)
    },

    /**
     * Track custom event
     */
    trackEvent: track,
  }
}
