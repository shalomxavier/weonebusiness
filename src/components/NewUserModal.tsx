import { X, ChevronDown } from 'lucide-react'
import { FormEvent, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { doc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase.ts'

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Director' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'WeOne Staff' },
] as const

export interface User {
  id: string
  userId: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'staff'
}

interface NewUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (user: User) => void
  editUser?: User | null
}

export default function NewUserModal({ isOpen, onClose, onSave, editUser }: NewUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const roleDropdownRef = useRef<HTMLDivElement>(null)
  const roleButtonRef = useRef<HTMLButtonElement>(null)
  const isEditMode = !!editUser

  // Function to get the lowest available 3-digit user ID
  const getLowestAvailableUserId = async (): Promise<string> => {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const existingUserIds = new Set<string>()
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      if (userData.userId) {
        existingUserIds.add(userData.userId)
      }
    })
    
    // Find the lowest available 3-digit number (001-999)
    for (let i = 1; i <= 999; i++) {
      const userId = i.toString().padStart(3, '0')
      if (!existingUserIds.has(userId)) {
        return userId
      }
    }
    
    throw new Error('No available user IDs. All 3-digit combinations are taken.')
  }

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node) && roleButtonRef.current && !roleButtonRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-fill user ID when modal opens for new user
  useEffect(() => {
    if (!isEditMode && isOpen) {
      getLowestAvailableUserId().then(setUserId).catch(console.error)
    }
  }, [isEditMode, isOpen])

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

  // Populate form when editUser changes
  useEffect(() => {
    if (editUser) {
      setName(editUser.name)
      setEmail(editUser.email)
      setRole(editUser.role)
      setUserId(editUser.userId || '')
      setPassword('')
      setError(null)
    } else {
      setName('')
      setEmail('')
      setRole('admin')
      setUserId('')
      setPassword('')
      setError(null)
    }
  }, [editUser, isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate user ID uniqueness
      if (userId) {
        const existingUserQuery = query(collection(db, 'users'), where('userId', '==', userId))
        const existingUserSnapshot = await getDocs(existingUserQuery)
        
        if (!existingUserSnapshot.empty && (!editUser || existingUserSnapshot.docs[0].id !== editUser.id)) {
          throw new Error(`User ID ${userId} is already taken. Please choose a different one.`)
        }
      }

      if (isEditMode && editUser) {
        // Update existing user - only update Firestore profile
        const userData: Partial<User> = {
          name,
          role: role as 'owner' | 'admin' | 'staff',
          userId: userId || editUser.userId,
        }
        await updateDoc(doc(db, 'users', editUser.id), userData)

        if (onSave) {
          onSave({ ...editUser, ...userData } as User)
        }
      } else {
        // Create new user
        // Create Firebase Auth user via REST API (doesn't sign them in)
        const result = await createUserViaAPI(email, password)

        // Create user profile in Firestore
        const userData: User = {
          id: result.localId,
          name,
          email,
          role: role as 'owner' | 'admin' | 'staff',
          userId: userId,
        }

        await setDoc(doc(db, 'users', result.localId), userData)

        if (onSave) {
          onSave(userData)
        }
      }

      // Reset form
      setName('')
      setEmail('')
      setPassword('')
      setRole('admin')
      setUserId('')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} user`
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">{isEditMode ? 'Edit User' : 'New User'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium mb-1">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value.replace(/\D/g, '').slice(0, 3))}
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={loading}
              placeholder="Auto-filled"
              maxLength={3}
            />
                      </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={loading || isEditMode}
            />
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            )}
          </div>

          {!isEditMode && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required={!isEditMode}
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>
          )}

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <div className="relative">
              <button
                ref={roleButtonRef}
                type="button"
                onClick={() => {
                  if (roleButtonRef.current) {
                    const rect = roleButtonRef.current.getBoundingClientRect()
                    setDropdownPosition({
                      top: rect.bottom + 4,
                      left: rect.left,
                      width: rect.width
                    })
                  }
                  setRoleDropdownOpen((p) => !p)
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              >
                <span>{ROLE_OPTIONS.find((o) => o.value === role)?.label || 'Select role'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {roleDropdownOpen && createPortal(
                <div
                  ref={roleDropdownRef}
                  style={{
                    position: 'fixed',
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                    zIndex: 9999
                  }}
                >
                  <ul className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    {ROLE_OPTIONS.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() => { setRole(opt.value); setRoleDropdownOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            role === opt.value
                              ? 'bg-white/10 text-white'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>,
                document.body
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading && <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
              </div>}
              {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
