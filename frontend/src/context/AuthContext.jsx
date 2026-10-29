import React, { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("cardio_token"))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get("/auth/me")
        setUser(res.data)
      } catch (err) {
        console.error("Auth check failed:", err)
        logout()
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [token])

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem("cardio_token", access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const register = async (email, full_name, password) => {
    const res = await api.post("/auth/register", { email, full_name, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem("cardio_token", access_token)
    setToken(access_token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem("cardio_token")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)