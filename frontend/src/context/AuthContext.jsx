import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/tickets'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Attach token request interceptor
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Intercept 401 Unauthorized responses to log out invalid sessions
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token')
          setUser(null)
          toast.error('Session expired. Please log in again.')
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Auto-fetch profile if token exists on load
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const res = await api.get('/api/auth/me')
          setUser(res.data)
        } catch (err) {
          console.error('Auto auth check failed:', err)
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Login handler
  async function login(email, password) {
    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { token, user: userData } = res.data
      localStorage.setItem('token', token)
      setUser(userData)
      toast.success(`Welcome back, ${userData.name}!`)
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password.')
      return false
    }
  }

  // Signup handler
  async function signUp(name, email, password) {
    try {
      const res = await api.post('/api/auth/signup', { name, email, password })
      return res.data // returns { success, message, email, test_otp }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed.')
      return null
    }
  }

  // OTP Verification handler
  async function verifyOtp(email, otp_code) {
    try {
      await api.post('/api/auth/verify', { email, otp_code })
      toast.success('Account verified successfully! You can now log in.')
      return true
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid verification OTP.')
      return false
    }
  }

  // Logout handler
  async function logout() {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await api.post('/api/auth/logout')
      } catch (err) {
        console.error('Server logout failed:', err)
      }
    }
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully.')
  }

  const value = {
    user,
    loading,
    login,
    signUp,
    verifyOtp,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
