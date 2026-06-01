import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import SplitText from './SplitText.tsx'
import MetricCard from './MetricCard.tsx'
import { Wallet, Coins, CreditCard, PoundSterling, TrendingUp, ArrowDownCircle, Phone, Eye, Pencil } from 'lucide-react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import EnquiryViewModal from './EnquiryViewModal'
import NewEnquiryModal from './NewEnquiryModal'
import type { Enquiry } from './NewEnquiryModal'

export default function Dashboard() {
  const { user } = useAuth()
  const greeting = `Hi ${user?.displayName || user?.email || 'User'},`
  const isOwner = user?.role === 'owner'

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [pickups, setPickups] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [removalOrders, setRemovalOrders] = useState<any[]>([])
  const [removalsExpenses, setRemovalsExpenses] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
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

  // Fetch data from Firestore
  useEffect(() => {
    const pickupsUnsubscribe = onSnapshot(
      query(collection(db, 'pickups'), orderBy('pickupDate', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setPickups(data)
      }
    )

    const ordersUnsubscribe = onSnapshot(
      query(collection(db, 'orders'), orderBy('deliveryDate', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setOrders(data)
      }
    )

    const expensesUnsubscribe = onSnapshot(
      query(collection(db, 'expenses'), orderBy('date', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setExpenses(data)
      }
    )

    const removalsUnsubscribe = onSnapshot(
      query(collection(db, 'removalOrders'), orderBy('removalDate', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setRemovalOrders(data)
      }
    )

    const removalsExpensesUnsubscribe = onSnapshot(
      query(collection(db, 'removalsExpenses'), orderBy('date', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setRemovalsExpenses(data)
      }
    )

    const leadsUnsubscribe = onSnapshot(
      query(collection(db, 'leads'), orderBy('createdAt', 'desc')),
      (snapshot) => setLeads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    )

    return () => {
      pickupsUnsubscribe()
      ordersUnsubscribe()
      expensesUnsubscribe()
      removalsUnsubscribe()
      removalsExpensesUnsubscribe()
      leadsUnsubscribe()
    }
  }, [])

  // Filter data by selected month/year and calculate totals
  const filteredPickups = pickups.filter((pickup) => {
    const date = new Date(pickup.pickupDate)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && pickup.status === 'collected'
  })

  const filteredOrders = orders.filter((order) => {
    const date = new Date(order.deliveryDate)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && order.status === 'delivered'
  })

  const filteredExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
  })

  const filteredRemovals = removalOrders.filter((order) => {
    const date = new Date(order.removalDate)
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && order.status === 'completed'
  })

  const filteredRemovalsExpenses = removalsExpenses.filter((expense) => {
    const date = new Date(expense.date)
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

  return (
    <div className="pt-0 px-6 lg:pt-32">
      <div className="px-4 text-left pt-6 animate-stack-up delay-300">
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
        <div className="flex gap-4 mt-8 px-4 justify-center lg:justify-end animate-stack-up delay-100">
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
        </div>
      )}

      {isOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-12 w-full px-4 pb-8 lg:pb-0 animate-stack-up delay-200">
          <MetricCard title="Used Goods Expense" value={`£${usedGoodsExpense.toFixed(2)}`} icon={CreditCard} iconColor="text-orange-400" />
          <MetricCard title="Used Goods Revenue" value={`£${usedGoodsRevenue.toFixed(2)}`} icon={Wallet} iconColor="text-green-400" />
          <MetricCard title="Used Goods Profit" value={`£${usedGoodsProfit.toFixed(2)}`} icon={PoundSterling} iconColor="text-blue-400" />
          <MetricCard title="Removals Expense" value={`£${removalsExpense.toFixed(2)}`} icon={ArrowDownCircle} iconColor="text-red-400" />
          <MetricCard title="Removals Revenue" value={`£${removalsTotalRevenue.toFixed(2)}`} icon={TrendingUp} iconColor="text-purple-400" />
          <MetricCard title="Removals Profit" value={`£${removalsProfit.toFixed(2)}`} icon={Coins} iconColor="text-yellow-400" />
        </div>
      )}
    </div>
  )
}
