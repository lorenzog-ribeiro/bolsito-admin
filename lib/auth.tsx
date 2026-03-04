"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { apiFetch } from "./api"

const TOKEN_KEY = "esb_dashboard_token"
const USER_KEY = "esb_dashboard_user"

export interface AuthUser {
  id: number
  email: string
  name: string | null
  isStaff?: boolean
  isSuperuser?: boolean
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStored(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem(TOKEN_KEY)
  const userJson = localStorage.getItem(USER_KEY)
  if (!token || !userJson) return null
  try {
    const user = JSON.parse(userJson) as AuthUser
    return { token, user }
  } catch {
    return null
  }
}

function persist(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  useEffect(() => {
    const stored = loadStored()
    if (!stored) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }
    setState({
      user: stored.user,
      token: stored.token,
      isLoading: true,
    })
    apiFetch<AuthUser>("/auth/me", { token: stored.token })
      .then((user) => {
        persist(stored.token, user)
        setState({
          user,
          token: stored.token,
          isLoading: false,
        })
      })
      .catch(() => {
        clearStorage()
        setState({ user: null, token: null, isLoading: false })
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; user: AuthUser }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    )
    persist(res.access_token, res.user)
    setState({
      user: res.user,
      token: res.access_token,
      isLoading: false,
    })
  }, [])

  const logout = useCallback(() => {
    clearStorage()
    setState({ user: null, token: null, isLoading: false })
  }, [])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    isAuthenticated: !!state.token,
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}
