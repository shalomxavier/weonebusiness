import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, db } from '../lib/firebase.ts'
import { doc, getDoc } from 'firebase/firestore'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapFirebaseUser(user: FirebaseUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Use ref to communicate between listener and login function
  const loginResolveRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const base = mapFirebaseUser(firebaseUser)
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            base.displayName = snap.data().name ?? base.displayName
          }
        } catch {
          // fall back to Firebase Auth displayName
        }
        setUser(base)
      } else {
        setUser(null)
      }
      setLoading(false)
      // Resolve pending login if any
      if (loginResolveRef.current) {
        loginResolveRef.current()
        loginResolveRef.current = null
      }
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Wait for the auth state listener to complete (it calls loginResolveRef when done)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          loginResolveRef.current = null
          reject(new Error('Login timeout - auth state did not update'))
        }, 10000)

        loginResolveRef.current = () => {
          clearTimeout(timeout)
          resolve()
        }
      })
    } catch (err) {
      loginResolveRef.current = null
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const logout = async (): Promise<void> => {
    setError(null)
    try {
      await signOut(auth)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
