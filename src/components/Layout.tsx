import { useMemo, useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, X, LogOut, Package, Truck, Receipt, Users, FileText, ShoppingBag, Truck as TruckIcon, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type NavItem = { id: string; label: string; to: string; icon: React.ElementType }
type NavSection = { id: string; title: string; icon: React.ElementType; defaultOpen?: boolean; items: NavItem[] }

function SidebarSection({
  section,
  isOpen,
  hasActiveItem,
  onToggle,
  onNavClick,
  lockNav,
}: {
  section: NavSection
  isOpen: boolean
  hasActiveItem: boolean
  onToggle: () => void
  onNavClick: () => void
  lockNav: () => void
}) {
  const contentRef = useRef<HTMLUListElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const animatingRef = useRef(false)
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0)

  const applyIdle = () => {
    if (!btnRef.current) return
    btnRef.current.style.background = 'transparent'
    btnRef.current.style.color = 'rgb(156 163 175)'
    btnRef.current.style.pointerEvents = 'auto'
    btnRef.current.style.cursor = 'pointer'
  }
  const applyHover = () => {
    if (!btnRef.current || animatingRef.current) return
    btnRef.current.style.background = 'rgba(255,255,255,0.1)'
    btnRef.current.style.color = 'white'
  }
  const applyAnimating = () => {
    if (!btnRef.current) return
    btnRef.current.style.background = 'transparent'
    btnRef.current.style.color = 'rgb(156 163 175)'
    btnRef.current.style.pointerEvents = 'none'
    btnRef.current.style.cursor = 'default'
    if (contentRef.current) contentRef.current.style.pointerEvents = 'none'
  }

  useEffect(() => {
    if (!contentRef.current) return
    animatingRef.current = true
    applyAnimating()
    const done = setTimeout(() => {
      animatingRef.current = false
      applyIdle()
      if (contentRef.current) contentRef.current.style.pointerEvents = 'auto'
    }, 500)
    if (isOpen) {
      setHeight(contentRef.current.scrollHeight)
      const t = setTimeout(() => setHeight(undefined), 500)
      return () => { clearTimeout(t); clearTimeout(done) }
    } else {
      const h = contentRef.current.scrollHeight
      setHeight(h)
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight(0)))
      return () => clearTimeout(done)
    }
  }, [isOpen])

  return (
    <div className="mb-2">
      <button
        ref={btnRef}
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left rounded-2xl"
        onClick={() => { lockNav(); applyAnimating(); onToggle() }}
        onMouseEnter={applyHover}
        onMouseLeave={applyIdle}
        aria-expanded={isOpen}
        aria-controls={`${section.id}-items`}
      >
        <div className="flex items-center gap-3">
          <section.icon className="w-5 h-5" />
          <p className="text-base font-medium tracking-wide">{section.title}</p>
        </div>
        {!hasActiveItem && (
          <ChevronRight
            className="h-4 w-4 transition-transform duration-500 ease-in-out"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        )}
      </button>
      <ul
        ref={contentRef}
        id={`${section.id}-items`}
        className="space-y-1 overflow-hidden"
        style={{
          maxHeight: height === undefined ? 'none' : `${height}px`,
          transition: 'max-height 500ms ease-in-out',
        }}
      >
        <div className="pt-1 pb-1">
          {section.items.map((item) => (
            <li key={item.id} className="list-none">
              <NavLink
                to={item.to}
                onClick={onNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                    isActive
                      ? 'bg-[#D946EF] text-white font-medium'
                      : 'text-gray-400 transition-none hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </div>
      </ul>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const navSections = useMemo(
    () => [
      {
        id: 'used-goods',
        title: 'Used Goods',
        icon: ShoppingBag,
        defaultOpen: false,
        items: [
          { id: 'used-orders', label: 'Orders', to: '/used/orders', icon: Package },
          { id: 'used-pickups', label: 'Pickups', to: '/used/pickups', icon: Truck },
          { id: 'used-expenses', label: 'Expenses', to: '/used/expenses', icon: Receipt },
        ],
      },
      {
        id: 'removals',
        title: 'Removals',
        icon: TruckIcon,
        defaultOpen: false,
        items: [{ id: 'removal-orders', label: 'Orders', to: '/removals/orders', icon: FileText }],
      },
      {
        id: 'users',
        title: 'Users',
        icon: User,
        defaultOpen: false,
        items: [{ id: 'user-manage', label: 'Manage', to: '/users/manage', icon: Users }],
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
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev }
      navSections.forEach((section) => {
        const hasActive = section.items.some(item => location.pathname.startsWith(item.to))
        if (!hasActive) next[section.id] = false
      })
      return next
    })
  }, [location.pathname, navSections])

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
        fixed inset-y-0 left-0 z-50 w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 rounded-r-3xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:h-screen lg:flex lg:flex-col lg:flex-shrink-0 lg:rounded-none lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative flex items-center h-16 px-6 mt-8">
          <h1 className="mx-auto text-3xl font-bold bg-gradient-to-r from-[#5227FF] to-[#FF9FFC] bg-clip-text text-transparent">WeOne</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-6 lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav ref={navRef} className="mt-6 flex-1 overflow-y-auto px-4 pb-6">
          {navSections.map((section) => {
            const hasActiveItem = section.items.some(item => location.pathname.startsWith(item.to))
            const isOpen = hasActiveItem || openSections[section.id]

            return (
              <SidebarSection
                key={section.id}
                section={section}
                isOpen={isOpen}
                hasActiveItem={hasActiveItem}
                onToggle={() => !hasActiveItem && toggleSection(section.id)}
                onNavClick={() => setSidebarOpen(false)}
                lockNav={() => {
                  if (!navRef.current) return
                  navRef.current.style.pointerEvents = 'none'
                  setTimeout(() => { if (navRef.current) navRef.current.style.pointerEvents = 'auto' }, 500)
                }}
              />
            )
          })}
        </nav>

        <div className="px-4 pb-6 pt-4 space-y-3">
          <p className="px-4 text-xs font-semibold tracking-widest text-gray-400">{user?.displayName || user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-3 rounded-2xl text-sm hover:bg-white/10 transition-colors"
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
