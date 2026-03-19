/**
 * Event Tracking System
 *
 * Tracks user interactions, screen views, session time, and actions.
 * Stores events in localStorage and can sync to backend.
 */

export type EventType =
  | "screen_view"
  | "screen_exit"
  | "button_click"
  | "form_submit"
  | "navigation"
  | "session_start"
  | "session_end"
  | "error"
  | "export"
  | "filter_change"

export interface TrackingEvent {
  id: string
  type: EventType
  timestamp: string
  screen?: string
  action?: string
  label?: string
  value?: string | number
  duration?: number // milliseconds spent on screen/action
  metadata?: Record<string, unknown>
  sessionId?: string
}

export interface ScreenTimeEntry {
  screen: string
  totalTime: number // milliseconds
  visits: number
  avgTime: number
}

export interface TrackingStats {
  totalEvents: number
  totalSessions: number
  avgSessionDuration: number
  eventsByType: Record<EventType, number>
  topScreens: { screen: string; count: number; avgTime: number }[]
  topActions: { action: string; count: number }[]
  screenTime: ScreenTimeEntry[]
  eventsByDay: { date: string; count: number }[]
  recentEvents: TrackingEvent[]
}

const STORAGE_KEY = "esb_tracking_events"
const SESSION_KEY = "esb_tracking_session"
const SCREEN_TIME_KEY = "esb_screen_time"
const MAX_EVENTS = 2000

// Session management
let currentSessionId: string | null = null
let currentScreen: string | null = null
let screenEnteredAt: number | null = null

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getStoredEvents(): TrackingEvent[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveEvents(events: TrackingEvent[]): void {
  if (typeof window === "undefined") return
  try {
    const trimmed = events.slice(-MAX_EVENTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function getScreenTimeData(): Record<string, { totalTime: number; visits: number }> {
  if (typeof window === "undefined") return {}
  try {
    const stored = localStorage.getItem(SCREEN_TIME_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveScreenTimeData(data: Record<string, { totalTime: number; visits: number }>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SCREEN_TIME_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/**
 * Start or resume a session
 */
export function startSession(): string {
  if (typeof window === "undefined") return ""

  // Check for existing session
  const existingSession = sessionStorage.getItem(SESSION_KEY)
  if (existingSession) {
    currentSessionId = existingSession
    return existingSession
  }

  // Create new session
  currentSessionId = generateId()
  sessionStorage.setItem(SESSION_KEY, currentSessionId)

  track("session_start", {
    metadata: {
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    }
  })

  return currentSessionId
}

/**
 * End the current session
 */
export function endSession(): void {
  if (!currentSessionId) return

  // Record final screen time
  if (currentScreen && screenEnteredAt) {
    const duration = Date.now() - screenEnteredAt
    track("screen_exit", { screen: currentScreen, duration })
    updateScreenTime(currentScreen, duration)
  }

  track("session_end")
  sessionStorage.removeItem(SESSION_KEY)
  currentSessionId = null
  currentScreen = null
  screenEnteredAt = null
}

/**
 * Track an event
 */
export function track(
  type: EventType,
  options: {
    screen?: string
    action?: string
    label?: string
    value?: string | number
    duration?: number
    metadata?: Record<string, unknown>
  } = {}
): void {
  const event: TrackingEvent = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId ?? undefined,
    ...options,
  }

  const events = getStoredEvents()
  events.push(event)
  saveEvents(events)

  if (process.env.NODE_ENV === "development") {
    console.log("[Track]", type, options)
  }
}

/**
 * Track entering a screen (with time tracking)
 */
export function trackScreenEnter(screen: string, metadata?: Record<string, unknown>): void {
  // Exit previous screen first
  if (currentScreen && screenEnteredAt && currentScreen !== screen) {
    const duration = Date.now() - screenEnteredAt
    track("screen_exit", { screen: currentScreen, duration })
    updateScreenTime(currentScreen, duration)
  }

  // Enter new screen
  currentScreen = screen
  screenEnteredAt = Date.now()
  track("screen_view", { screen, metadata })
}

/**
 * Track a screen view (alias for compatibility)
 */
export function trackScreenView(screen: string, metadata?: Record<string, unknown>): void {
  trackScreenEnter(screen, metadata)
}

/**
 * Update accumulated screen time
 */
function updateScreenTime(screen: string, duration: number): void {
  const data = getScreenTimeData()
  if (!data[screen]) {
    data[screen] = { totalTime: 0, visits: 0 }
  }
  data[screen].totalTime += duration
  data[screen].visits += 1
  saveScreenTimeData(data)
}

/**
 * Track a button click
 */
export function trackClick(
  action: string,
  label?: string,
  metadata?: Record<string, unknown>
): void {
  track("button_click", {
    action,
    label,
    screen: currentScreen ?? undefined,
    metadata
  })
}

/**
 * Track a form submission
 */
export function trackFormSubmit(
  formName: string,
  success: boolean,
  metadata?: Record<string, unknown>
): void {
  track("form_submit", {
    action: formName,
    label: success ? "success" : "failure",
    screen: currentScreen ?? undefined,
    metadata,
  })
}

/**
 * Track navigation
 */
export function trackNavigation(from: string, to: string): void {
  track("navigation", {
    action: "navigate",
    label: `${from} -> ${to}`,
    metadata: { from, to },
  })
}

/**
 * Track an error
 */
export function trackError(
  errorMessage: string,
  metadata?: Record<string, unknown>
): void {
  track("error", {
    action: "error",
    label: errorMessage,
    screen: currentScreen ?? undefined,
    metadata,
  })
}

/**
 * Track export action
 */
export function trackExport(
  exportType: string,
  count?: number,
  metadata?: Record<string, unknown>
): void {
  track("export", {
    action: exportType,
    value: count,
    screen: currentScreen ?? undefined,
    metadata,
  })
}

/**
 * Track filter change
 */
export function trackFilterChange(
  filterName: string,
  value: string | number,
  metadata?: Record<string, unknown>
): void {
  track("filter_change", {
    action: filterName,
    value,
    screen: currentScreen ?? undefined,
    metadata,
  })
}

/**
 * Get tracking statistics for dashboard
 */
export function getTrackingStats(): TrackingStats {
  const events = getStoredEvents()
  const screenTimeData = getScreenTimeData()

  // Initialize counters
  const eventsByType: Record<EventType, number> = {
    screen_view: 0,
    screen_exit: 0,
    button_click: 0,
    form_submit: 0,
    navigation: 0,
    session_start: 0,
    session_end: 0,
    error: 0,
    export: 0,
    filter_change: 0,
  }

  const screenCounts: Record<string, number> = {}
  const actionCounts: Record<string, number> = {}
  const eventsByDay: Record<string, number> = {}
  const sessions = new Set<string>()
  let totalSessionDuration = 0

  // Process events
  for (const event of events) {
    eventsByType[event.type]++

    if (event.sessionId) {
      sessions.add(event.sessionId)
    }

    if (event.screen) {
      screenCounts[event.screen] = (screenCounts[event.screen] || 0) + 1
    }

    if (event.action && event.type === "button_click") {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1
    }

    // Count by day
    const day = event.timestamp.slice(0, 10)
    eventsByDay[day] = (eventsByDay[day] || 0) + 1
  }

  // Calculate session durations
  const sessionEvents = events.filter(e =>
    e.type === "session_start" || e.type === "session_end"
  )
  const sessionStarts: Record<string, string> = {}

  for (const event of sessionEvents) {
    if (event.sessionId) {
      if (event.type === "session_start") {
        sessionStarts[event.sessionId] = event.timestamp
      } else if (event.type === "session_end" && sessionStarts[event.sessionId]) {
        const start = new Date(sessionStarts[event.sessionId]).getTime()
        const end = new Date(event.timestamp).getTime()
        totalSessionDuration += end - start
      }
    }
  }

  // Build screen time entries
  const screenTime: ScreenTimeEntry[] = Object.entries(screenTimeData)
    .map(([screen, data]) => ({
      screen,
      totalTime: data.totalTime,
      visits: data.visits,
      avgTime: data.visits > 0 ? Math.round(data.totalTime / data.visits) : 0,
    }))
    .sort((a, b) => b.totalTime - a.totalTime)

  // Top screens with avg time
  const topScreens = Object.entries(screenCounts)
    .map(([screen, count]) => {
      const timeData = screenTimeData[screen]
      const avgTime = timeData && timeData.visits > 0
        ? Math.round(timeData.totalTime / timeData.visits)
        : 0
      return { screen, count, avgTime }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Top actions
  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Events by day (last 30 days)
  const eventsByDayArray = Object.entries(eventsByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  const totalSessions = sessions.size
  const avgSessionDuration = totalSessions > 0
    ? Math.round(totalSessionDuration / totalSessions)
    : 0

  return {
    totalEvents: events.length,
    totalSessions,
    avgSessionDuration,
    eventsByType,
    topScreens,
    topActions,
    screenTime,
    eventsByDay: eventsByDayArray,
    recentEvents: events.slice(-100).reverse(),
  }
}

/**
 * Clear all tracking data
 */
export function clearTrackingData(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SCREEN_TIME_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  currentSessionId = null
  currentScreen = null
  screenEnteredAt = null
}

/**
 * Generate mock data for demonstration
 */
export function generateMockTrackingData(): void {
  const screens = [
    "/",
    "/analytics",
    "/simuladores",
    "/simuladores/EMPRESTIMO",
    "/simulacoes",
    "/simulacoes/EMPRESTIMO",
    "/rankings",
    "/rankings/card-machines",
    "/assets",
    "/permissoes",
  ]

  const actions = [
    "export_csv",
    "save_params",
    "delete_user",
    "change_password",
    "view_details",
    "open_folder",
    "download_image",
    "toggle_permission",
    "apply_filter",
    "clear_filter",
  ]

  const now = Date.now()
  const events: TrackingEvent[] = []
  const screenTimeData: Record<string, { totalTime: number; visits: number }> = {}

  // Generate 20 sessions over last 30 days
  for (let sessionIdx = 0; sessionIdx < 20; sessionIdx++) {
    const sessionId = generateId()
    const daysAgo = Math.floor(Math.random() * 30)
    const sessionStart = now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000

    // Session start
    events.push({
      id: generateId(),
      type: "session_start",
      timestamp: new Date(sessionStart).toISOString(),
      sessionId,
      metadata: { screenWidth: 1920, screenHeight: 1080 },
    })

    // Generate 5-15 events per session
    const numEvents = 5 + Math.floor(Math.random() * 10)
    let currentTime = sessionStart

    for (let i = 0; i < numEvents; i++) {
      currentTime += 10000 + Math.random() * 120000 // 10s to 2min between events
      const screen = screens[Math.floor(Math.random() * screens.length)]

      // Screen view
      events.push({
        id: generateId(),
        type: "screen_view",
        timestamp: new Date(currentTime).toISOString(),
        screen,
        sessionId,
      })

      // Update screen time
      const screenDuration = 15000 + Math.random() * 180000 // 15s to 3min
      if (!screenTimeData[screen]) {
        screenTimeData[screen] = { totalTime: 0, visits: 0 }
      }
      screenTimeData[screen].totalTime += screenDuration
      screenTimeData[screen].visits += 1

      // Maybe add an action
      if (Math.random() > 0.5) {
        currentTime += 5000 + Math.random() * 30000
        const action = actions[Math.floor(Math.random() * actions.length)]
        events.push({
          id: generateId(),
          type: "button_click",
          timestamp: new Date(currentTime).toISOString(),
          screen,
          action,
          sessionId,
        })
      }

      // Maybe add a form submit
      if (Math.random() > 0.8) {
        currentTime += 10000 + Math.random() * 60000
        events.push({
          id: generateId(),
          type: "form_submit",
          timestamp: new Date(currentTime).toISOString(),
          screen,
          action: "save_form",
          label: Math.random() > 0.1 ? "success" : "failure",
          sessionId,
        })
      }
    }

    // Session end
    currentTime += 5000
    events.push({
      id: generateId(),
      type: "session_end",
      timestamp: new Date(currentTime).toISOString(),
      sessionId,
    })
  }

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  saveEvents(events)
  saveScreenTimeData(screenTimeData)
}

/**
 * Get current session info
 */
export function getCurrentSession(): { sessionId: string | null; currentScreen: string | null } {
  return {
    sessionId: currentSessionId,
    currentScreen,
  }
}

/**
 * Format duration in human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  return `${Math.round(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`
}
