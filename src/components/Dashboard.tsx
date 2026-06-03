import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext.tsx'
import SplitText from './SplitText.tsx'
import MetricCard from './MetricCard.tsx'
import { Wallet, Coins, CreditCard, PoundSterling, TrendingUp, ArrowDownCircle, Phone, Eye, Pencil, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { collection, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import EnquiryViewModal from './EnquiryViewModal'
import NewEnquiryModal from './NewEnquiryModal'
import type { Enquiry } from './NewEnquiryModal'

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const select = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    onChange(iso)
    setOpen(false)
  }
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }
  const display = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  const btnRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState({ top: 0, right: 0 })

  const openCalendar = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(p => !p)
  }

  const calendar = open ? createPortal(
    <div
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
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={openCalendar}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-purple-400 flex-shrink-0" />
        {display && (
          <>
            <span className="text-sm text-gray-300">{display}</span>
            <span
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </span>
          </>
        )}
      </button>
      {calendar}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const greeting = `Hi ${user?.displayName || user?.email || 'User'},`
  const isOwner = user?.role === 'owner'

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [useSpecificDate, setUseSpecificDate] = useState(false)

  const [pickups, setPickups] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [removalOrders, setRemovalOrders] = useState<any[]>([])
  const [removalsExpenses, setRemovalsExpenses] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewLead, setViewLead] = useState<Enquiry | null>(null)
  const [editLead, setEditLead] = useState<Enquiry | null>(null)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { greeting: 'Good morning', message: 'Ready to start your day?' }
    if (hour < 17) return { greeting: 'Good afternoon', message: 'Hope your day is going great!' }
    return { greeting: 'Good evening', message: 'Time to wind down nicely.' }
  }

  const timeGreeting = getTimeBasedGreeting()

  // Fetch static data once with getDocs; keep onSnapshot only for leads (real-time Today's Tasks)
  useEffect(() => {
    const fetchStatic = async () => {
      const [pickupsSnap, ordersSnap, expensesSnap, removalsSnap, removalsExpensesSnap] = await Promise.all([
        getDocs(query(collection(db, 'pickups'), orderBy('pickupDate', 'desc'))),
        getDocs(query(collection(db, 'orders'), orderBy('deliveryDate', 'desc'))),
        getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'removalOrders'), orderBy('removalDate', 'desc'))),
        getDocs(query(collection(db, 'removalsExpenses'), orderBy('date', 'desc'))),
      ])
      setPickups(pickupsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setOrders(ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setExpenses(expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setRemovalOrders(removalsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setRemovalsExpenses(removalsExpensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }
    fetchStatic()

    const leadsUnsubscribe = onSnapshot(
      query(collection(db, 'leads'), orderBy('createdAt', 'desc')),
      (snapshot) => setLeads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    )

    return () => {
      leadsUnsubscribe()
    }
  }, [])

  // Filter and calculate — memoized so they only recompute when deps change
  const metrics = useMemo(() => {
    const filteredPickups = pickups.filter((pickup) => {
      const date = new Date(pickup.pickupDate)
      if (useSpecificDate && selectedDate) {
        const pickupDateStr = pickup.pickupDate.split('T')[0]
        return pickupDateStr === selectedDate && pickup.status === 'collected'
      }
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && pickup.status === 'collected'
    })
    const filteredOrders = orders.filter((order) => {
      const date = new Date(order.deliveryDate)
      if (useSpecificDate && selectedDate) {
        const deliveryDateStr = order.deliveryDate.split('T')[0]
        return deliveryDateStr === selectedDate && order.status === 'delivered'
      }
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && order.status === 'delivered'
    })
    const filteredExpenses = expenses.filter((expense) => {
      const date = new Date(expense.date)
      if (useSpecificDate && selectedDate) {
        const expenseDateStr = expense.date.split('T')[0]
        return expenseDateStr === selectedDate
      }
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })
    const filteredRemovals = removalOrders.filter((order) => {
      const date = new Date(order.removalDate)
      if (useSpecificDate && selectedDate) {
        const removalDateStr = order.removalDate.split('T')[0]
        return removalDateStr === selectedDate && order.status === 'completed'
      }
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && order.status === 'completed'
    })
    const filteredRemovalsExpenses = removalsExpenses.filter((expense) => {
      const date = new Date(expense.date)
      if (useSpecificDate && selectedDate) {
        const expenseDateStr = expense.date.split('T')[0]
        return expenseDateStr === selectedDate
      }
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })

    const usedGoodsRevenue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0)
    const pickupsExpense = filteredPickups.reduce((sum, pickup) => sum + (parseFloat(pickup.price) || 0), 0)
    const pickupsAdvance = filteredPickups.reduce((sum, pickup) => sum + (parseFloat(pickup.advance) || 0), 0)
    const otherExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    const usedGoodsExpense = pickupsExpense + otherExpenses + pickupsAdvance
    const usedGoodsProfit = usedGoodsRevenue - usedGoodsExpense

    const removalsRevenue = filteredRemovals.reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0)
    const removalsAdvance = filteredRemovals.reduce((sum, order) => sum + (parseFloat(order.advance) || 0), 0)
    const removalsTotalRevenue = removalsRevenue + removalsAdvance
    const removalsExpense = filteredRemovalsExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    const removalsProfit = removalsTotalRevenue - removalsExpense

    return { usedGoodsRevenue, usedGoodsExpense, usedGoodsProfit, removalsTotalRevenue, removalsExpense, removalsProfit }
  }, [pickups, orders, expenses, removalOrders, removalsExpenses, selectedMonth, selectedYear, selectedDate, useSpecificDate])

  return (
    <div className="pt-0 px-6 lg:pt-32">
      {loading && (
        <div className="animate-pulse">
          <div className="px-4 pt-6">
            <div className="h-12 w-64 bg-white/10 rounded-xl mb-4" />
            <div className="h-5 w-48 bg-white/5 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 w-full px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-2xl" />
            ))}
          </div>
        </div>
      )}
      {!loading && <div key="content">
      <div key="header" className="px-4 text-left pt-6 animate-stack-up delay-100">
        <SplitText
          text={greeting}
          className="text-5xl font-bold text-gray-300"
          tag="h1"
          delay={50}
          duration={0.8}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="left"
        />
        <p className="text-lg text-gray-400 mt-3">
          {timeGreeting.greeting}! {timeGreeting.message}
        </p>

        {isOwner && (() => {
          const todayIso = (() => {
            const t = new Date()
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
          })()
          const callToday = leads.filter((e: any) => e.callBackDate === todayIso)
          const STATUS_LABELS: Record<string, string> = {
            'no-answer': 'No Answer', 'answered': 'Answered',
            'very-interested': 'Very Interested', 'looking-for-quotes': 'Looking for Quotes', 'completed': 'Completed',
          }
          const STATUS_COLORS: Record<string, string> = {
            'no-answer': 'text-gray-400 bg-gray-400/10', 'answered': 'text-blue-400 bg-blue-400/10',
            'very-interested': 'text-green-400 bg-green-400/10', 'looking-for-quotes': 'text-yellow-400 bg-yellow-400/10',
            'completed': 'text-purple-400 bg-purple-400/10',
          }
          return (
            <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Today's Tasks</h2>
              {callToday.length === 0 ? (
                <p className="text-sm text-gray-500">No callbacks scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold tracking-widest text-red-400 uppercase">Call Today</span>
                    <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">{callToday.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {callToday.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/30 border border-red-500/20">
                        <div className="min-w-0">
                          <p className="text-base font-medium text-white truncate">{e.name}</p>
                          <p className="text-sm text-gray-400">{e.contactNumber}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`hidden sm:inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                            {STATUS_LABELS[e.status]}
                          </span>
                          <button type="button" onClick={() => setViewLead(e)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditLead(e)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <EnquiryViewModal
        isOpen={!!viewLead}
        onClose={() => setViewLead(null)}
        enquiry={viewLead}
      />

      <NewEnquiryModal
        isOpen={!!editLead}
        onClose={() => setEditLead(null)}
        editEnquiry={editLead}
      />

      {isOwner && (
        <div key="filters" className="flex flex-col sm:flex-row gap-4 mt-8 px-4 justify-center lg:justify-end animate-stack-up delay-200">
          <DatePicker
            value={selectedDate}
            onChange={(v) => {
              setSelectedDate(v)
              setUseSpecificDate(!!v)
            }}
          />
          {!useSpecificDate && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-auto px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index} className="bg-gray-900">
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-auto px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i
                  return (
                    <option key={year} value={year} className="bg-gray-900">
                      {year}
                    </option>
                  )
                })}
              </select>
            </>
          )}
        </div>
      )}

      {isOwner && (
        <div key="cards" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 w-full px-4 pb-8 lg:pb-0 animate-stack-up delay-300">
          <MetricCard title="Used Goods Expense" value={`£${metrics.usedGoodsExpense.toFixed(2)}`} icon={CreditCard} iconColor="text-orange-400" />
          <MetricCard title="Used Goods Revenue" value={`£${metrics.usedGoodsRevenue.toFixed(2)}`} icon={Wallet} iconColor="text-green-400" />
          <MetricCard title="Used Goods Profit" value={`£${metrics.usedGoodsProfit.toFixed(2)}`} icon={PoundSterling} iconColor="text-blue-400" />
          <MetricCard title="Removals Expense" value={`£${metrics.removalsExpense.toFixed(2)}`} icon={ArrowDownCircle} iconColor="text-red-400" />
          <MetricCard title="Removals Revenue" value={`£${metrics.removalsTotalRevenue.toFixed(2)}`} icon={TrendingUp} iconColor="text-purple-400" />
          <MetricCard title="Removals Profit" value={`£${metrics.removalsProfit.toFixed(2)}`} icon={Coins} iconColor="text-yellow-400" />
        </div>
      )}
      </div>}
    </div>
  )
}
