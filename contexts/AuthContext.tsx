'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { authenticateWithFirebase } from '@/lib/firebase/client'

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  token: string | null
  firebaseAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false)

  useEffect(() => {
    // Vérifier si un token existe dans le localStorage
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      fetchUser(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setUser(response.data.user || response.data)
      
      // Authentifier avec Firebase si un token Firebase est disponible
      if (response.data.firebaseToken) {
        try {
          await authenticateWithFirebase(response.data.firebaseToken)
          setFirebaseAuthenticated(true)
          console.log('✅ Authentification Firebase réussie')
        } catch (firebaseError) {
          console.warn('⚠️ Erreur authentification Firebase:', firebaseError)
          // Essayer d'obtenir un nouveau token Firebase
          try {
            const tokenResponse = await axios.get(`${API_URL}/auth/firebase-token`, {
              headers: { Authorization: `Bearer ${authToken}` }
            })
            if (tokenResponse.data.firebaseToken) {
              await authenticateWithFirebase(tokenResponse.data.firebaseToken)
              setFirebaseAuthenticated(true)
            }
          } catch (tokenError) {
            console.warn('⚠️ Impossible d\'obtenir un token Firebase:', tokenError)
          }
        }
      }
    } catch (error) {
      localStorage.removeItem('token')
      setToken(null)
      setFirebaseAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, role?: string) => {
    const response = await axios.post(`${API_URL}/auth/login`, { 
      email, 
      password,
      ...(role && { role }) // Inclure le rôle si fourni
    })
    const { token: newToken, firebaseToken, user: newUser } = response.data
    
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    
    // Authentifier avec Firebase si un token Firebase est disponible
    if (firebaseToken) {
      try {
        await authenticateWithFirebase(firebaseToken)
        setFirebaseAuthenticated(true)
        console.log('✅ Authentification Firebase réussie après connexion')
      } catch (firebaseError) {
        console.warn('⚠️ Erreur authentification Firebase après connexion:', firebaseError)
        // Essayer d'obtenir un nouveau token Firebase
        try {
          const tokenResponse = await axios.get(`${API_URL}/auth/firebase-token`, {
            headers: { Authorization: `Bearer ${newToken}` }
          })
          if (tokenResponse.data.firebaseToken) {
            await authenticateWithFirebase(tokenResponse.data.firebaseToken)
            setFirebaseAuthenticated(true)
          }
        } catch (tokenError) {
          console.warn('⚠️ Impossible d\'obtenir un token Firebase:', tokenError)
        }
      }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setFirebaseAuthenticated(false)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    
    // Déconnexion Firebase
    try {
      const { getAuthInstance } = require('@/lib/firebase/client')
      const auth = getAuthInstance()
      auth.signOut()
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion Firebase:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token, firebaseAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

