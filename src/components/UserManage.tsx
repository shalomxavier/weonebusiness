import { useMemo, useState, useEffect, useRef } from 'react'
import { Search, X, Users, Crown, Shield, Trash2, ChevronDown, Eye, Pencil } from 'lucide-react'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.ts'
import { useAuth } from '../context/AuthContext.tsx'
import NewUserModal, { type User } from './NewUserModal'
import UserViewModal from './UserViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'owner', label: 'Director' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'WeOne Staff' },
] as const

function RoleDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (v: 'all' | 'owner' | 'admin' | 'staff') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = ROLE_OPTIONS.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative flex-1 min-w-[140px]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <span>{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute z-[200] mt-1 w-full bg-black rounded-2xl overflow-hidden shadow-xl">
          {ROLE_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function UserManage() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToView, setUserToView] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin' | 'staff'>('all')

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter)
    }

    return result
  }, [users, searchQuery, roleFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
  }

  // Real-time sync with Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData: User[] = []
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() } as User)
        })
        setUsers(usersData)
      },
      (error) => {
        console.error('Error fetching users:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleSaveUser = (_user: User) => {
    // User will be added via real-time listener
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const handleEditClick = (user: User) => {
    if (!isAdmin) return
    setUserToEdit(user)
    setIsModalOpen(true)
  }

  const handleViewClick = (user: User) => {
    setUserToView(user)
    setIsViewModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setUserToEdit(null)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    setDeleteLoading(true)
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id))
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Users</p>
          <h1 className="text-4xl font-semibold leading-tight">Manage</h1>
        </header>
        {isAdmin && (
          <button type="button" onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10">
            New User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stack-up delay-100">
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">Total Users</p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">Directors</p>
            <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'owner').length}</p>
          </div>
          <div className="flex items-center justify-center">
            <Crown className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">Admins</p>
            <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">WeOne Staff</p>
            <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'staff').length}</p>
          </div>
          <div className="flex items-center justify-center">
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-4 w-full animate-stack-up delay-200">
        <div className="relative w-1/2 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-base text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <RoleDropdown value={roleFilter} onChange={setRoleFilter} />

        {(searchQuery || roleFilter !== 'all') && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-300 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 animate-stack-up delay-300">
          <p className="text-sm">
            {users.length === 0
              ? 'No users yet. Start by creating a new user.'
              : 'No users match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl animate-stack-up delay-300">
          <div className="overflow-x-auto rounded-3xl">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-base font-semibold">User ID</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Role</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Email</th>
                  <th className="text-right px-4 py-3 text-base font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-base font-mono">{user.userId || 'N/A'}</td>
                    <td className="px-4 py-3 text-base">{user.name}</td>
                    <td className="px-4 py-3 text-base">
                      {user.role === 'owner'
                        ? <Crown className="w-5 h-5 text-purple-400" />
                        : user.role === 'admin'
                        ? <Shield className="w-5 h-5 text-blue-400" />
                        : <Users className="w-5 h-5 text-green-400" />}
                    </td>
                    <td className="px-4 py-3 text-base">{user.email}</td>
                    <td className="px-4 py-3 text-base text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewClick(user)}
                          className="p-1.5 rounded transition-colors hover:bg-white/10 text-gray-400 hover:text-gray-200"
                          title="View user"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-1.5 rounded transition-colors hover:bg-white/10 text-gray-400 hover:text-blue-400"
                              title="Edit user"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-1.5 rounded transition-colors hover:bg-white/10 text-gray-400 hover:text-red-400"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewUserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveUser}
        editUser={userToEdit}
      />

      <UserViewModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setUserToView(null) }}
        user={userToView}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name || 'this user'}? This action cannot be undone.`}
        itemName={userToDelete?.name}
        loading={deleteLoading}
      />
    </section>
  )
}
