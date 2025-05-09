"use client"

import type React from "react"
import axios from "@/lib/axios"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  username: string
  role: "admin" | "team"
  teamName?: string
  token?: string
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string, role: "admin" | "team") => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
})

export const useAuth = () => useContext(AuthContext)

// Mock users for demo
const MOCK_USERS = [
  { username: "admin", password: "admin123", role: "admin" as const },
  { username: "teamA", password: "passA", role: "team" as const, teamName: "Team Alpha" },
  { username: "teamB", password: "passB", role: "team" as const, teamName: "Team Beta" },
  { username: "teamC", password: "passC", role: "team" as const, teamName: "Team Gamma" },
  { username: "teamD", password: "passD", role: "team" as const, teamName: "Team Delta" },
  { username: "teamE", password: "passE", role: "team" as const, teamName: "Team Epsilon" },
  { username: "teamF", password: "passF", role: "team" as const, teamName: "Team Zeta" },
  { username: "teamG", password: "passG", role: "team" as const, teamName: "Team Eta" },
  { username: "teamH", password: "passH", role: "team" as const, teamName: "Team Theta" },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("promptWarsUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Route protection
  useEffect(() => {
    // If not logged in and not on login page, redirect to login
    if (!user && pathname !== "/") {
      router.push("/")
    }

    // If logged in as team but trying to access admin pages
    if (user?.role === "team" && pathname.startsWith("/admin")) {
      router.push("/arena")
    }

    // If logged in as admin but trying to access team pages
    if (user?.role === "admin" && pathname.startsWith("/arena")) {
      router.push("/admin/dashboard")
    }

    // If logged in but on login page, redirect to appropriate dashboard
    if (user && pathname === "/") {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/arena")
      }
    }
  }, [user, pathname, router])

  const login = async (username: string, password: string, role: "admin" | "team") => {
    try {
      const response = await axios.post("/auth/login", {
        username,
        password,
        role,
      })
      if (response.data && response.data.success) {
        const userData = {
          username,
          role: response.data.role,
          token: response.data.token,
        }
        setUser(userData)
        localStorage.setItem("promptWarsUser", JSON.stringify(userData))
        return true
      }
      return false
    } catch (err: any) {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("promptWarsUser")
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
