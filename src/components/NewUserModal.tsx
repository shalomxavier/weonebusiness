import { X, Loader2 } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.ts'

export interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin'
}

interface NewUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (user: User) => void
}

export default function NewUserModal({ isOpen, onClose, onSave }: NewUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Firebase REST API to create user without signing them in
  const createUserViaAPI = async (email: string, password: string) => {
    const API_KEY = 'AIzaSyCkkQfWvRSkAalBHRQMHL7pIabUVCLZsHA'
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: false, // Don't return tokens, don't sign in
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to create user')
    }

    return response.json()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Create Firebase Auth user via REST API (doesn't sign them in)
      const result = await createUserViaAPI(email, password)
      const userId = result.localId

      // Create user profile in Firestore
      const userData: User = {
        id: userId,
        name,
        email,
        role: role as 'owner' | 'admin',
      }

      await setDoc(doc(db, 'users', userId), userData)

      if (onSave) {
        onSave(userData)
      }

      // Reset form
      setName('')
      setEmail('')
      setPassword('')
      setRole('admin')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md card">
        <div className="flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">New User</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email ID
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              required
              minLength={6}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              disabled={loading}
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn border px-6"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn border px-6 flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
