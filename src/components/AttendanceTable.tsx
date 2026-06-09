import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Search, Clock, LogIn, LogOut, Calendar, ChevronDown } from 'lucide-react'

interface AttendanceRecord {
  id: string
  userId: string
  userCode: string
  userName: string
  userEmail: string
  clockIn: Timestamp
  clockOut: Timestamp | null
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDuration(clockIn: Date, clockOut: Date): string {
  const secs = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
] as const
type DateFilter = typeof DATE_FILTERS[number]['value']

function DateDropdown({ value, onChange }: { value: DateFilter; onChange: (v: DateFilter) => void }) {
  const [open, setOpen] = useState(false)
  const selected = DATE_FILTERS.find((f) => f.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 whitespace-nowrap"
      >
        <Calendar className="w-4 h-4" />
        <span>{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute z-[200] mt-1 right-0 w-40 bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10">
          {DATE_FILTERS.map((f) => (
            <li key={f.value}>
              <button
                type="button"
                onClick={() => { onChange(f.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === f.value ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AttendanceTable() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('clockIn', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)))
      setLoading(false)
    }, (e) => {
      console.error('Failed to load attendance', e)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let result = [...records]

    if (dateFilter !== 'all') {
      const threshold = dateFilter === 'today' ? startOfDay : dateFilter === 'week' ? startOfWeek : startOfMonth
      result = result.filter((r) => r.clockIn.toDate() >= threshold)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.userCode.toLowerCase().includes(q)
      )
    }

    return result
  }, [records, searchQuery, dateFilter])

  const activeCount = filtered.filter((r) => r.clockOut === null).length
  const completedCount = filtered.filter((r) => r.clockOut !== null).length

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
        <p className="text-sm text-gray-400">Track clock-in and clock-out records for all users</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{loading ? '—' : filtered.length}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-widest text-green-500 uppercase mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{loading ? '—' : activeCount}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">Completed</p>
          <p className="text-2xl font-bold text-white">{loading ? '—' : completedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <DateDropdown value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Table */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-500">
            <Clock className="w-8 h-8 opacity-40" />
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">User</th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">ID</th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><LogIn className="w-3.5 h-3.5" /> In</span>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Out</span>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Duration</th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => {
                  const clockInDate = record.clockIn.toDate()
                  const clockOutDate = record.clockOut ? record.clockOut.toDate() : null
                  const isActive = clockOutDate === null
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium">{record.userName}</p>
                        <p className="text-xs text-gray-500">{record.userEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{record.userCode || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-300">{formatDate(clockInDate)}</td>
                      <td className="px-5 py-3.5 text-green-400 font-mono">{formatTime(clockInDate)}</td>
                      <td className="px-5 py-3.5 text-red-400 font-mono">
                        {clockOutDate ? formatTime(clockOutDate) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-white font-mono">
                        {clockOutDate ? formatDuration(clockInDate, clockOutDate) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-400 border border-white/10">
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
