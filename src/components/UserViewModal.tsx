import { X, Crown, Shield, Mail, User as UserIcon, Hash } from 'lucide-react'
import type { User } from './NewUserModal'

interface UserViewModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
}

export default function UserViewModal({ isOpen, onClose, user }: UserViewModalProps) {
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">User Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-purple-400" />
            </div>
          </div>

          {/* User ID */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase flex items-center gap-2">
              <Hash className="w-3 h-3" />
              User ID
            </p>
            <p className="text-lg text-gray-200 font-mono">{user.userId || 'N/A'}</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Name</p>
            <p className="text-lg text-gray-200">{user.name}</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase flex items-center gap-2">
              <Mail className="w-3 h-3" />
              Email
            </p>
            <p className="text-base text-gray-200">{user.email}</p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Role</p>
            <div className="flex items-center gap-2">
              {user.role === 'owner' ? (
                <>
                  <Crown className="w-5 h-5 text-purple-400" />
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300">
                    {ROLE_LABELS[user.role]}
                  </span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                    {ROLE_LABELS[user.role]}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
