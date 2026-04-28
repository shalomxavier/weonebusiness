import { useMemo, useState, useEffect } from 'react'
import { Search, X, Users, Crown, Shield, Trash2, Loader2 } from 'lucide-react'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.ts'
import NewUserModal, { type User } from './NewUserModal'
import DeleteConfirmModal from './DeleteConfirmModal'

export default function UserManage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'admin'>('all')

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
    setLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData: User[] = []
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() } as User)
        })
        setUsers(usersData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching users:', error)
        setLoading(false)
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
    <section className="flex-1 p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Users</p>
          <h1 className="text-3xl font-semibold leading-tight">Manage</h1>
        </header>
        <button type="button" className="btn border" onClick={() => setIsModalOpen(true)}>
          New User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Total Users</p>
            <p className="text-2xl font-semibold">{users.length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
            <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Owners</p>
            <p className="text-2xl font-semibold">{users.filter(u => u.role === 'owner').length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Admins</p>
            <p className="text-2xl font-semibold">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
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

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>

        {(searchQuery || roleFilter !== 'all') && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-sm">
            {users.length === 0
              ? 'No users yet. Start by creating a new user.'
              : 'No users match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Role</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-sm">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'owner'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />

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
