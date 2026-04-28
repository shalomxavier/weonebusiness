import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const navSections = useMemo(
    () => [
      {
        id: 'used-goods',
        title: 'Used Goods',
        defaultOpen: false,
        items: [
          { id: 'used-orders', label: 'Orders', to: '/used/orders' },
          { id: 'used-pickups', label: 'Pickups', to: '/used/pickups' },
          { id: 'used-expenses', label: 'Expenses', to: '/used/expenses' },
        ],
      },
      {
        id: 'removals',
        title: 'Removals',
        defaultOpen: false,
        items: [{ id: 'removal-orders', label: 'Orders', to: '/removals/orders' }],
      },
      {
        id: 'users',
        title: 'Users',
        defaultOpen: false,
        items: [{ id: 'user-manage', label: 'Manage', to: '/users/manage' }],
      },
    ],
    []
  )

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    navSections.reduce((acc, section) => {
      acc[section.id] = section.defaultOpen ?? false
      return acc
    }, {} as Record<string, boolean>)
  )

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  return (
    <div className="min-h-screen lg:flex text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black/30 backdrop-blur-md border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:h-screen lg:flex lg:flex-col lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative flex items-center h-16 px-6 border-b border-white/10">
          <h1 className="mx-auto text-2xl font-semibold">WeOne</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-6 lg:hidden p-2 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto px-4 pb-6">
          {navSections.map((section) => {
            const isOpen = openSections[section.id]

            return (
              <div key={section.id} className="border-b border-white/10 last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-2 py-4 text-left text-base"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${section.id}-items`}
                >
                  <div>
                    <p className="text-lg font-semibold tracking-wide">{section.title}</p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isOpen && (
                  <ul
                    id={`${section.id}-items`}
                    className="px-6 pb-4 space-y-1 text-base"
                  >
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''}`
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-4 pb-6 border-t border-white/10 pt-4 space-y-1">
          <p className="px-2 text-xs font-semibold tracking-widest text-gray-400">{user?.displayName || user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <Outlet />
    </div>
  )
}
