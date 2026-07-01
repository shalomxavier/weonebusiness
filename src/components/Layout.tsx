import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronRight, X, LogOut, Package, Truck, Receipt, Users, FileText, ShoppingBag, Truck as TruckIcon, User, Menu, Target, UserPlus, CalendarCheck, Clock, LogIn, LogOut as LogOutIcon, ChevronLeft, ChevronDown } from 'lucide-react'
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

interface UserAttendanceRecord {
  id: string
  clockIn: Timestamp
  clockOut: Timestamp | null
  clockInApproved: boolean
  clockOutApproved: boolean
}

function formatAttTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatAttDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatAttDuration(clockIn: Date, clockOut: Date): string {
  const secs = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
}

const ATT_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function UserAttendanceModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [records, setRecords] = useState<UserAttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', user.uid),
      orderBy('clockIn', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserAttendanceRecord)))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [user])

  const filtered = records.filter((r) => {
    if (!r.clockInApproved) return false
    const d = r.clockIn.toDate()
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  const totalSecs = filtered.reduce((acc, r) => {
    if (!r.clockOut) return acc
    return acc + Math.floor((r.clockOut.toDate().getTime() - r.clockIn.toDate().getTime()) / 1000)
  }, 0)

  const totalH = Math.floor(totalSecs / 3600)
  const totalM = Math.floor((totalSecs % 3600) / 60)

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">My Attendance</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) } else setSelectedMonth(m => m - 1) }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white flex-1 text-center">{ATT_MONTHS[selectedMonth]} {selectedYear}</span>
          <button
            onClick={() => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) } else setSelectedMonth(m => m + 1) }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </button>
        </div>

        {/* Total */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 px-6 py-3 bg-purple-500/10 border-b border-purple-500/20 flex-shrink-0">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
            <span className="ml-auto text-lg font-bold text-white font-mono">{String(totalH).padStart(2,'0')}h {String(totalM).padStart(2,'0')}m</span>
          </div>
        )}

        {/* Records */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-500">
              <Clock className="w-7 h-7 opacity-30" />
              <p className="text-sm">No records for this month</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-5 py-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><LogIn className="w-3 h-3" /> In</span>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><LogOutIcon className="w-3 h-3" /> Out</span>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => {
                  const ci = r.clockIn.toDate()
                  const co = r.clockOut ? r.clockOut.toDate() : null
                  return (
                    <tr key={r.id} className={`border-b border-white/5 last:border-0 ${idx % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                      <td className="px-5 py-3 text-gray-300 text-xs">{formatAttDate(ci)}</td>
                      <td className="px-5 py-3 text-green-400 font-mono">{formatAttTime(ci)}</td>
                      <td className="px-5 py-3 font-mono">
                        {co ? <span className="text-red-400">{formatAttTime(co)}</span> : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-white font-mono">
                        {co ? formatAttDuration(ci, co) : <span className="text-yellow-500 text-xs">Active</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function UserProfileButton({ name }: { name: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [attendanceOpen, setAttendanceOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate flex-1 text-left">{name}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
      </button>

      {menuOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative w-full max-w-xs bg-[#111] border border-white/10 rounded-3xl p-2 space-y-1">
            <div className="px-4 py-3 border-b border-white/10 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <p className="text-base font-medium text-white truncate">{name}</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-2">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setAttendanceOpen(true) }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                <Clock className="w-4 h-4" style={{ color: 'rgb(242, 20, 144)' }} />
                View Attendance
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {attendanceOpen && <UserAttendanceModal onClose={() => setAttendanceOpen(false)} />}
    </>
  )
}

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
        onClick={() => { if (!hasActiveItem) { lockNav(); applyAnimating(); onToggle() } }}
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
                      ? 'bg-gradient-to-r from-[#FF1493] via-[#C71585] to-[#FF1493] text-white font-medium'
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
  const isStaff = user?.role === 'staff'

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
        items: [
          { id: 'removal-orders', label: 'Orders', to: '/removals/orders', icon: FileText },
          { id: 'removal-expenses', label: 'Expenses', to: '/removals/expenses', icon: Receipt },
        ],
      },
      {
        id: 'users',
        title: 'Users',
        icon: User,
        defaultOpen: false,
        items: [
          { id: 'user-manage', label: 'Manage', to: '/users/manage', icon: Users },
          { id: 'user-attendance', label: 'Attendance', to: '/users/attendance', icon: CalendarCheck },
        ],
      },
      {
        id: 'productivity',
        title: 'Productivity',
        icon: Target,
        defaultOpen: false,
        items: [{ id: 'productivity-leads', label: 'Leads', to: '/productivity/leads', icon: UserPlus }],
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
    <div className="h-screen lg:flex text-white">
      {/* Staff users see simplified layout with minimal sidebar */}
      {isStaff ? (
        <>
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Simplified sidebar for staff */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:h-screen lg:flex lg:flex-col lg:flex-shrink-0 lg:rounded-3xl
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="relative flex items-center h-16 px-6 mt-8">
              <Link to="/" className="mx-auto">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5227FF] to-[#FF1493] bg-clip-text text-transparent">WeOne</h1>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-6 lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1" />

            <div className="px-4 pb-6 pt-4 space-y-3">
              <UserProfileButton name={user?.displayName || user?.email || 'Me'} />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col overflow-auto">
            {/* Mobile top bar */}
            <div className="lg:hidden flex items-center justify-center px-4 py-4 bg-black/20 backdrop-blur-xl border-b border-white/10 relative">
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute left-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5227FF] to-[#FF1493] bg-clip-text text-transparent">WeOne</h1>
              </Link>
            </div>
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:h-screen lg:flex lg:flex-col lg:flex-shrink-0 lg:rounded-3xl
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="relative flex items-center h-16 px-6 mt-8">
              <Link to="/" className="mx-auto">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5227FF] to-[#FF1493] bg-clip-text text-transparent">WeOne</h1>
              </Link>
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
              <UserProfileButton name={user?.displayName || user?.email || 'Me'} />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col overflow-auto">
            {/* Mobile top bar */}
            <div className="lg:hidden flex items-center justify-center px-4 py-4 bg-black/20 backdrop-blur-xl border-b border-white/10 relative">
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute left-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5227FF] to-[#FF1493] bg-clip-text text-transparent">WeOne</h1>
              </Link>
            </div>
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
