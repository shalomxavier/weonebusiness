import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Clock, LogIn, LogOut, CalendarDays, ChevronLeft, ChevronRight, X, ChevronDown, User } from 'lucide-react'

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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface UserOption {
  id: string
  name: string
  email: string
}

function UserDropdown({ value, onChange, users }: { value: string; onChange: (v: string) => void; users: UserOption[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = users.find((u) => u.id === value)
  const label = selected ? selected.name : 'All Users'

  return (
    <div ref={ref} className="relative min-w-[160px]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full h-10 flex items-center gap-2 px-3 bg-white/10 border border-white/20 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-colors"
      >
        <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className={`flex-1 text-left truncate ${value ? 'text-white font-medium' : 'text-gray-400'}`}>{label}</span>
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        {!value && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <ul className="absolute z-[200] mt-1 w-full min-w-[200px] bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
          <li>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                !value ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Users
            </button>
          </li>
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => { onChange(u.id); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === u.id ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {u.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState({ top: 0, right: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        calendarRef.current && !calendarRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const select = (day: number) => {
    onChange(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`)
    setOpen(false)
  }
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }
  const display = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'

  const openCalendar = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(p => !p)
  }

  const calendar = open ? createPortal(
    <div
      ref={calendarRef}
      style={{ position: 'fixed', top: coords.top, right: coords.right, zIndex: 9999, backgroundColor: '#1a1a1a', width: '18rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.9)', padding: '1rem' }}
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/10 text-gray-300"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-semibold text-gray-200">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/10 text-gray-300"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isSelected = dateStr === value
          const isToday = dateStr === todayStr
          return (
            <button
              key={i}
              type="button"
              onClick={() => select(day)}
              className={`w-8 h-8 mx-auto rounded-xl text-xs font-medium transition-colors ${
                isSelected ? 'bg-purple-600 text-white' :
                isToday ? 'ring-1 ring-white/20 text-white' :
                'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
        <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-xs text-gray-400 hover:text-white">Clear</button>
        <button type="button" onClick={() => { onChange(todayStr); setOpen(false) }} className="text-xs text-purple-400 hover:text-purple-300">Today</button>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        ref={btnRef}
        type="button"
        onClick={openCalendar}
        className="h-10 w-full flex items-center gap-2 px-3 bg-white/10 border border-white/20 rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className={`text-sm ${value ? 'text-white font-medium' : 'text-gray-400'}`}>{display}</span>
        {value && (
          <span onClick={(e) => { e.stopPropagation(); onChange('') }} className="text-gray-400 hover:text-white ml-1">
            <X className="w-3 h-3" />
          </span>
        )}
      </button>
      {calendar}
    </div>
  )
}

export default function AttendanceTable() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [useSpecificDate, setUseSpecificDate] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [users, setUsers] = useState<UserOption[]>([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserOption[] = []
      snap.forEach((d) => {
        const data = d.data()
        list.push({ id: d.id, name: data.name || data.displayName || data.email || d.id, email: data.email || '' })
      })
      list.sort((a, b) => a.name.localeCompare(b.name))
      setUsers(list)
    })
    return () => unsub()
  }, [])

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
    let result = records.filter((r) => {
      const d = r.clockIn.toDate()
      if (useSpecificDate && selectedDate) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        return dateStr === selectedDate
      }
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })

    if (selectedUserId) {
      result = result.filter((r) => r.userId === selectedUserId)
    }

    return result
  }, [records, selectedDate, useSpecificDate, selectedMonth, selectedYear, selectedUserId])

  const totalWorkingSeconds = useMemo(() => {
    if (!selectedUserId) return null
    return filtered.reduce((acc, r) => {
      if (!r.clockOut) return acc
      return acc + Math.floor((r.clockOut.toDate().getTime() - r.clockIn.toDate().getTime()) / 1000)
    }, 0)
  }, [filtered, selectedUserId])

  const formatTotalDuration = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
  }

  return (
    <div className="p-8 pt-20 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Staff</p>
          <h1 className="text-4xl font-semibold leading-tight">Attendance</h1>
        </header>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:flex-wrap sm:items-center">
        <UserDropdown
          value={selectedUserId}
          onChange={setSelectedUserId}
          users={users}
        />
        <DatePicker
          value={selectedDate}
          onChange={(v) => { setSelectedDate(v); setUseSpecificDate(!!v) }}
        />
        <select
          value={useSpecificDate ? '' : selectedMonth}
          onChange={(e) => { if (e.target.value !== '') { setSelectedMonth(parseInt(e.target.value)); setUseSpecificDate(false); setSelectedDate('') } }}
          disabled={useSpecificDate}
          className="h-10 w-full sm:w-auto px-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {useSpecificDate && <option value="">Month</option>}
          {MONTHS.map((month, index) => (
            <option key={month} value={index} className="bg-gray-900">{month}</option>
          ))}
        </select>
        <select
          value={useSpecificDate ? '' : selectedYear}
          onChange={(e) => { if (e.target.value !== '') { setSelectedYear(parseInt(e.target.value)); setUseSpecificDate(false); setSelectedDate('') } }}
          disabled={useSpecificDate}
          className="h-10 w-full sm:w-auto px-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {useSpecificDate && <option value="">Year</option>}
          {Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - 2 + i
            return <option key={year} value={year} className="bg-gray-900">{year}</option>
          })}
        </select>
      </div>

      {/* Total Working Hours Summary */}
      {selectedUserId && totalWorkingSeconds !== null && (
        <div className="flex items-center gap-4 px-6 py-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Total Working Hours</p>
            <p className="text-2xl font-bold text-white font-mono">{formatTotalDuration(totalWorkingSeconds)}</p>
          </div>
          <div className="ml-auto text-right">
            {filtered.some(r => !r.clockOut) && (
              <p className="text-xs text-yellow-500/80">{filtered.filter(r => !r.clockOut).length} session{filtered.filter(r => !r.clockOut).length > 1 ? 's' : ''} still active</p>
            )}
          </div>
        </div>
      )}

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
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><LogIn className="w-3.5 h-3.5" /> In</span>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Out</span>
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => {
                  const clockInDate = record.clockIn.toDate()
                  const clockOutDate = record.clockOut ? record.clockOut.toDate() : null
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium">{record.userName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">{formatDate(clockInDate)}</td>
                      <td className="px-5 py-3.5 text-green-400 font-mono">{formatTime(clockInDate)}</td>
                      <td className="px-5 py-3.5 text-red-400 font-mono">
                        {clockOutDate ? formatTime(clockOutDate) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-white font-mono">
                        {clockOutDate ? formatDuration(clockInDate, clockOutDate) : <span className="text-gray-600">—</span>}
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
