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
import BreakdownModal from './BreakdownModal'
import ClockIn from './ClockIn'
import type { Enquiry } from './NewEnquiryModal'

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

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
  const display = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'

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
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={openCalendar}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className={`text-sm ${value ? 'text-white font-medium' : 'text-gray-400'}`}>{display}</span>
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="text-gray-400 hover:text-white ml-1"
          >
            <X className="w-3 h-3" />
          </span>
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
  const [currentTime, setCurrentTime] = useState(new Date())

  const [pickups, setPickups] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [removalOrders, setRemovalOrders] = useState<any[]>([])
  const [removalsExpenses, setRemovalsExpenses] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewLead, setViewLead] = useState<Enquiry | null>(null)
  const [editLead, setEditLead] = useState<Enquiry | null>(null)
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean
    title: string
    total: string
    categories: {
      label: string
      value: number
      count: number
      transactions: { id: string; title: string; subtitle?: string; amount: number; date?: string; status?: string }[]
    }[]
  }>({ isOpen: false, title: '', total: '', categories: [] })


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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format time for different timezones
  const getFormattedTime = (timezone: string) => {
    return currentTime.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getFormattedDate = (timezone: string) => {
    return currentTime.toLocaleDateString('en-GB', {
      timeZone: timezone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

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
    console.log('🔍 Filtering with:', { useSpecificDate, selectedDate, selectedMonth, selectedYear })
    console.log('📦 Total pickups:', pickups.length)
    if (pickups.length > 0) {
      console.log('  Sample pickup:', { date: pickups[0].pickupDate, status: pickups[0].status, number: pickups[0].pickupNumber })
    }
    console.log('📦 Total orders:', orders.length)
    if (orders.length > 0) {
      console.log('  Sample order:', { date: orders[0].deliveryDate, status: orders[0].status, customer: orders[0].customerName })
    }
    
    const filteredPickups = pickups.filter((pickup) => {
      if (useSpecificDate && selectedDate) {
        const pickupDateStr = pickup.pickupDate?.split('T')[0] || pickup.pickupDate
        return pickupDateStr === selectedDate
      }
      const date = new Date(pickup.pickupDate)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })
    
    console.log('📊 Filtered pickups:', filteredPickups.length)
    const filteredOrders = orders.filter((order) => {
      if (useSpecificDate && selectedDate) {
        const deliveryDateStr = order.deliveryDate?.split('T')[0] || order.deliveryDate
        const matches = deliveryDateStr === selectedDate
        console.log('  Checking order:', deliveryDateStr, 'vs', selectedDate, '=', matches)
        return matches
      }
      const date = new Date(order.deliveryDate)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })
    const filteredExpenses = expenses.filter((expense) => {
      if (useSpecificDate && selectedDate) {
        const expenseDateStr = expense.date?.split('T')[0] || expense.date
        return expenseDateStr === selectedDate
      }
      const date = new Date(expense.date)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })
    const filteredRemovals = removalOrders.filter((order) => {
      if (useSpecificDate && selectedDate) {
        const removalDateStr = order.removalDate?.split('T')[0] || order.removalDate
        return removalDateStr === selectedDate
      }
      const date = new Date(order.removalDate)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })
    const filteredRemovalsExpenses = removalsExpenses.filter((expense) => {
      if (useSpecificDate && selectedDate) {
        const expenseDateStr = expense.date?.split('T')[0] || expense.date
        return expenseDateStr === selectedDate
      }
      const date = new Date(expense.date)
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    })

    // Used Goods Revenue = price from delivered orders + advance from pending orders
    const deliveredOrdersPrice = filteredOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0)
    const pendingOrdersAdvance = filteredOrders
      .filter(o => o.status === 'pending')
      .reduce((sum, order) => sum + (parseFloat(order.advance) || 0), 0)
    const usedGoodsRevenue = deliveredOrdersPrice + pendingOrdersAdvance
    // All item costs = price from collected pickups + advance from pending pickups
    const collectedPickupsPrice = filteredPickups
      .filter(p => p.status === 'collected')
      .reduce((sum, pickup) => sum + (parseFloat(pickup.price) || 0), 0)
    const pendingPickupsAdvance = filteredPickups
      .filter(p => p.status === 'pending')
      .reduce((sum, pickup) => sum + (parseFloat(pickup.advance) || 0), 0)
    const allItemCosts = collectedPickupsPrice + pendingPickupsAdvance
    const otherExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    const usedGoodsExpense = allItemCosts + otherExpenses
    const usedGoodsProfit = usedGoodsRevenue - usedGoodsExpense

    const completedRemovalsPrice = filteredRemovals
      .filter(r => r.status === 'completed')
      .reduce((sum, order) => sum + (parseFloat(order.totalPrice) || 0), 0)
    const pendingRemovalsAdvance = filteredRemovals
      .filter(r => r.status === 'pending')
      .reduce((sum, order) => sum + (parseFloat(order.advance) || 0), 0)
    const removalsTotalRevenue = completedRemovalsPrice + pendingRemovalsAdvance
    const removalsExpense = filteredRemovalsExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    const removalsProfit = removalsTotalRevenue - removalsExpense

    // Build detailed breakdown data with transactions
    const collectedPickupsTx = filteredPickups
      .filter(p => p.status === 'collected' && parseFloat(p.price) > 0)
      .map(p => ({
        id: p.id,
        title: p.pickupNumber || p.id.slice(-6),
        subtitle: p.customerName || p.customerPhone || 'Unknown',
        amount: parseFloat(p.price) || 0,
        date: p.pickupDate,
        status: p.status
      }))

    const pendingPickupsTx = filteredPickups
      .filter(p => p.status === 'pending' && parseFloat(p.advance) > 0)
      .map(p => ({
        id: p.id,
        title: p.pickupNumber || p.id.slice(-6),
        subtitle: p.customerName || p.customerPhone || 'Unknown',
        amount: parseFloat(p.advance) || 0,
        date: p.pickupDate,
        status: p.status
      }))

    const otherExpensesTx = filteredExpenses
      .filter(e => parseFloat(e.amount) > 0)
      .map(e => ({
        id: e.id,
        title: e.description || e.type || 'Expense',
        subtitle: e.type || 'Uncategorized',
        amount: parseFloat(e.amount) || 0,
        date: e.date
      }))

    const deliveredOrdersTx = filteredOrders
      .filter(o => o.status === 'delivered' && parseFloat(o.price) > 0)
      .map(o => ({
        id: o.id,
        title: o.orderNumber || o.id.slice(-6),
        subtitle: o.customerName || o.customerPhone || 'Unknown',
        amount: parseFloat(o.price) || 0,
        date: o.deliveryDate,
        status: o.status
      }))

    const pendingOrdersTx = filteredOrders
      .filter(o => o.status === 'pending' && parseFloat(o.advance) > 0)
      .map(o => ({
        id: o.id,
        title: o.orderNumber || o.id.slice(-6),
        subtitle: o.customerName || o.customerPhone || 'Unknown',
        amount: parseFloat(o.advance) || 0,
        date: o.deliveryDate,
        status: o.status
      }))

    const completedRemovalsTx = filteredRemovals
      .filter(r => r.status === 'completed' && parseFloat(r.totalPrice) > 0)
      .map(r => ({
        id: r.id,
        title: r.removalNumber || r.id.slice(-6),
        subtitle: r.customerName || r.customerPhone || 'Unknown',
        amount: parseFloat(r.totalPrice) || 0,
        date: r.removalDate,
        status: r.status
      }))

    const pendingRemovalsTx = filteredRemovals
      .filter(r => r.status === 'pending' && parseFloat(r.advance) > 0)
      .map(r => ({
        id: r.id,
        title: r.removalNumber || r.id.slice(-6),
        subtitle: r.customerName || r.customerPhone || 'Unknown',
        amount: parseFloat(r.advance) || 0,
        date: r.removalDate,
        status: r.status
      }))

    const removalExpensesTx = filteredRemovalsExpenses
      .filter(e => parseFloat(e.amount) > 0)
      .map(e => ({
        id: e.id,
        title: e.description || e.type || 'Removal Expense',
        subtitle: e.type || 'Uncategorized',
        amount: parseFloat(e.amount) || 0,
        date: e.date
      }))

    const usedGoodsExpenseCategories = [
      { label: 'Collected Pickups Price', value: collectedPickupsPrice, count: collectedPickupsTx.length, transactions: collectedPickupsTx },
      { label: 'Pending Pickups Advance', value: pendingPickupsAdvance, count: pendingPickupsTx.length, transactions: pendingPickupsTx },
      { label: 'Other Expenses', value: otherExpenses, count: otherExpensesTx.length, transactions: otherExpensesTx },
    ].filter(c => c.value > 0 || c.count > 0)

    const usedGoodsRevenueCategories = [
      { label: 'Delivered Orders Price', value: deliveredOrdersPrice, count: deliveredOrdersTx.length, transactions: deliveredOrdersTx },
      { label: 'Pending Orders Advance', value: pendingOrdersAdvance, count: pendingOrdersTx.length, transactions: pendingOrdersTx },
    ].filter(c => c.value > 0 || c.count > 0)

    const removalsRevenueCategories = [
      { label: 'Completed Removals Price', value: completedRemovalsPrice, count: completedRemovalsTx.length, transactions: completedRemovalsTx },
      { label: 'Pending Removals Advance', value: pendingRemovalsAdvance, count: pendingRemovalsTx.length, transactions: pendingRemovalsTx },
    ].filter(c => c.value > 0 || c.count > 0)

    const removalsExpenseCategories = [
      { label: 'Removal Expenses', value: removalsExpense, count: removalExpensesTx.length, transactions: removalExpensesTx },
    ].filter(c => c.value > 0 || c.count > 0)

    return { 
      usedGoodsRevenue, 
      usedGoodsExpense, 
      usedGoodsProfit, 
      removalsTotalRevenue, 
      removalsExpense, 
      removalsProfit,
      breakdowns: {
        usedGoodsExpense: usedGoodsExpenseCategories,
        usedGoodsRevenue: usedGoodsRevenueCategories,
        usedGoodsProfit: [
          { label: 'Revenue', value: usedGoodsRevenue, count: usedGoodsRevenueCategories.reduce((sum, c) => sum + c.count, 0), transactions: [...deliveredOrdersTx, ...pendingOrdersTx] },
          { label: 'Expense (deducted)', value: -usedGoodsExpense, count: usedGoodsExpenseCategories.reduce((sum, c) => sum + c.count, 0), transactions: [...collectedPickupsTx, ...pendingPickupsTx, ...otherExpensesTx] },
        ],
        removalsTotalRevenue: removalsRevenueCategories,
        removalsExpense: removalsExpenseCategories,
        removalsProfit: [
          { label: 'Revenue', value: removalsTotalRevenue, count: removalsRevenueCategories.reduce((sum, c) => sum + c.count, 0), transactions: [...completedRemovalsTx, ...pendingRemovalsTx] },
          { label: 'Expense (deducted)', value: -removalsExpense, count: removalsExpenseCategories.reduce((sum, c) => sum + c.count, 0), transactions: removalExpensesTx },
        ],
      }
    }
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

        {/* Mobile: clock-in full width, then two time cards half each */}
        <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
          <div className="col-span-2">
            <ClockIn fullWidth />
          </div>
          <div className="flex items-center justify-center px-3 py-2 bg-black/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">India (IST)</p>
              <p className="text-base font-bold text-white">{getFormattedTime('Asia/Kolkata')}</p>
              <p className="text-xs text-gray-400">{getFormattedDate('Asia/Kolkata')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center px-3 py-2 bg-black/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">UK (GMT/BST)</p>
              <p className="text-base font-bold text-white">{getFormattedTime('Europe/London')}</p>
              <p className="text-xs text-gray-400">{getFormattedDate('Europe/London')}</p>
            </div>
          </div>
        </div>

        {/* Desktop: fixed top-right */}
        <div className="fixed top-4 right-4 z-40 hidden lg:flex items-stretch gap-3">
          <ClockIn />
          <div className="flex items-center justify-center px-5 py-3 bg-black/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">India (IST)</p>
              <p className="text-lg font-bold text-white">{getFormattedTime('Asia/Kolkata')}</p>
              <p className="text-xs text-gray-400">{getFormattedDate('Asia/Kolkata')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center px-5 py-3 bg-black/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">UK (GMT/BST)</p>
              <p className="text-lg font-bold text-white">{getFormattedTime('Europe/London')}</p>
              <p className="text-xs text-gray-400">{getFormattedDate('Europe/London')}</p>
            </div>
          </div>
        </div>

        {isOwner && (() => {
          const todayIso = (() => {
            const t = new Date()
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
          })()
          const callToday = leads.filter((e: any) => e.callBackDate === todayIso && e.status !== 'got-booked' && e.status !== 'completed-without-booking')
          const STATUS_LABELS: Record<string, string> = {
            'no-answer': 'No Answer', 'answered': 'Answered',
            'very-interested': 'Very Interested', 'looking-for-quotes': 'Looking for Quotes',
            'got-booked': 'Got Booked', 'completed-without-booking': 'Completed Without Booking',
          }
          const STATUS_COLORS: Record<string, string> = {
            'no-answer': 'text-gray-400 bg-gray-400/10', 'answered': 'text-blue-400 bg-blue-400/10',
            'very-interested': 'text-green-400 bg-green-400/10', 'looking-for-quotes': 'text-yellow-400 bg-yellow-400/10',
            'got-booked': 'text-purple-400 bg-purple-400/10', 'completed-without-booking': 'text-orange-400 bg-orange-400/10',
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

      <BreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal(prev => ({ ...prev, isOpen: false }))}
        title={breakdownModal.title}
        total={breakdownModal.total}
        categories={breakdownModal.categories}
      />

      {isOwner && (
        <div key="filters" className="flex flex-col sm:flex-row gap-4 mt-8 px-4 justify-center lg:justify-end animate-stack-up delay-200">
          <DatePicker
            value={selectedDate}
            onChange={(v) => {
              console.log('📅 Date selected:', v)
              setSelectedDate(v)
              setUseSpecificDate(!!v)
              console.log('📅 useSpecificDate set to:', !!v)
            }}
          />
          <select
            value={useSpecificDate ? '' : selectedMonth}
            onChange={(e) => {
              if (e.target.value !== '') {
                setSelectedMonth(parseInt(e.target.value))
                setUseSpecificDate(false)
                setSelectedDate('')
              }
            }}
            disabled={useSpecificDate}
            className="w-auto px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {useSpecificDate && <option value="">Month</option>}
            {months.map((month, index) => (
              <option key={month} value={index} className="bg-gray-900">
                {month}
              </option>
            ))}
          </select>
          <select
            value={useSpecificDate ? '' : selectedYear}
            onChange={(e) => {
              if (e.target.value !== '') {
                setSelectedYear(parseInt(e.target.value))
                setUseSpecificDate(false)
                setSelectedDate('')
              }
            }}
            disabled={useSpecificDate}
            className="w-auto px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {useSpecificDate && <option value="">Year</option>}
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i
              return (
                <option key={year} value={year} className="bg-gray-900">
                  {year}
                </option>
              )
            })}
          </select>
        </div>
      )}

      {isOwner && (
        <div key="cards" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 w-full px-4 pb-8 lg:pb-0 animate-stack-up delay-300">
          <MetricCard 
            title="Used Goods Expense" 
            value={`£${metrics.usedGoodsExpense.toFixed(2)}`} 
            icon={CreditCard} 
            iconColor="text-orange-400" 
            onClick={() => setBreakdownModal({
              isOpen: true,
              title: 'Used Goods Expense',
              total: `£${metrics.usedGoodsExpense.toFixed(2)}`,
              categories: metrics.breakdowns.usedGoodsExpense
            })}
          />
          <MetricCard 
            title="Used Goods Revenue" 
            value={`£${metrics.usedGoodsRevenue.toFixed(2)}`} 
            icon={Wallet} 
            iconColor="text-green-400" 
            onClick={() => setBreakdownModal({
              isOpen: true,
              title: 'Used Goods Revenue',
              total: `£${metrics.usedGoodsRevenue.toFixed(2)}`,
              categories: metrics.breakdowns.usedGoodsRevenue
            })}
          />
          <MetricCard 
            title="Used Goods Profit" 
            value={`£${metrics.usedGoodsProfit.toFixed(2)}`} 
            icon={PoundSterling} 
            iconColor="text-blue-400" 
            onClick={() => setBreakdownModal({
              isOpen: true,
              title: 'Used Goods Profit',
              total: `£${metrics.usedGoodsProfit.toFixed(2)}`,
              categories: metrics.breakdowns.usedGoodsProfit
            })}
          />
          <MetricCard 
            title="Removals Expense" 
            value={`£${metrics.removalsExpense.toFixed(2)}`} 
            icon={ArrowDownCircle} 
            iconColor="text-red-400" 
            onClick={() => setBreakdownModal({
              isOpen: true,
              title: 'Removals Expense',
              total: `£${metrics.removalsExpense.toFixed(2)}`,
              categories: metrics.breakdowns.removalsExpense
            })}
          />
          <MetricCard 
            title="Removals Revenue" 
            value={`£${metrics.removalsTotalRevenue.toFixed(2)}`} 
            icon={TrendingUp} 
            iconColor="text-purple-400" 
            onClick={() => setBreakdownModal({
              isOpen: true,
              title: 'Removals Revenue',
              total: `£${metrics.removalsTotalRevenue.toFixed(2)}`,
              categories: metrics.breakdowns.removalsTotalRevenue
            })}
          />
          <MetricCard 
            title="Removals Profit" 
            value={`£${metrics.removalsProfit.toFixed(2)}`} 
            icon={Coins} 
            iconColor="text-yellow-400" 
            onClick={() => setBreakdownModal({
              isOpen: true,
              title: 'Removals Profit',
              total: `£${metrics.removalsProfit.toFixed(2)}`,
              categories: metrics.breakdowns.removalsProfit
            })}
          />
        </div>
      )}
      </div>}
    </div>
  )
}
