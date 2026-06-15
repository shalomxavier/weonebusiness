import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Pencil, Trash2, Clock, CheckCircle2, Search, X, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Download } from 'lucide-react'
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import NewRemovalModal from './NewRemovalModal'
import RemovalViewModal from './RemovalViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import ExportModal from './ExportModal'
import * as XLSX from 'xlsx'

interface RemovalOrder {
  id: string
  customerName: string
  email: string
  phone: string
  postcode: string
  address: string
  notes: string
  removalDate: string
  totalPrice: string
  advance: string
  advanceDate: string
  startTime: string
  endTime: string
  paymentMethod: 'card' | 'cash' | 'both'
  status: 'pending' | 'completed'
  attachments?: string[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
] as const

function StatusDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (v: 'all' | 'pending' | 'completed') => void
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

  const selected = STATUS_OPTIONS.find((o) => o.value === value)

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
          {STATUS_OPTIONS.map((opt) => (
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

function DatePicker({ value, onChange, placeholder = 'Select date' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
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
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const select = (day: number) => {
    const s = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    onChange(s)
    setOpen(false)
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }

  const display = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : placeholder

  return (
    <div ref={ref} className="relative flex-1 min-w-[160px]">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-3 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <span className={value ? 'text-gray-300' : 'text-gray-500'}>{display}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span onClick={(e) => { e.stopPropagation(); onChange('') }} className="p-0.5 hover:text-white">
              <X className="w-3 h-3" />
            </span>
          )}
          <CalendarDays className="w-4 h-4" />
        </div>
      </button>
      {open && (
        <div className="absolute z-[200] mt-1 left-0 w-full bg-black rounded-3xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/10 text-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-200">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/10 text-gray-300">
              <ChevronRight className="w-4 h-4" />
            </button>
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
          <div className="flex justify-between mt-3 pt-3">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-xs text-gray-400 hover:text-white">Clear</button>
            <button type="button" onClick={() => { onChange(todayStr); setOpen(false) }} className="text-xs text-purple-400 hover:text-purple-300">Today</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RemovalsOrders() {
  const [orders, setOrders] = useState<RemovalOrder[]>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<RemovalOrder | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'removalOrders'), orderBy('removalDate', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RemovalOrder[]
      setOrders(data)
    })
    return () => unsubscribe()
  }, [])

  const handleView = (order: RemovalOrder) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleEdit = (order: RemovalOrder) => {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  const handleDelete = (order: RemovalOrder) => {
    setSelectedOrder(order)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedOrder) {
      try {
        await deleteDoc(doc(db, 'removalOrders', selectedOrder.id))
      } catch (error) {
        console.error('Error deleting removal order:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedOrder(null)
  }

  const handleSaveOrder = async (order: RemovalOrder, newFiles: File[] = []) => {
    const { id, ...orderData } = order
    const existingIndex = orders.findIndex((o) => o.id === id)

    const uploadedUrls: string[] = []
    for (const file of newFiles) {
      const fileRef = storageRef(storage, `removalOrders/${id || Date.now()}_${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(fileRef, file)
      const url = await getDownloadURL(snapshot.ref)
      uploadedUrls.push(url)
    }

    const finalData = {
      ...orderData,
      attachments: [...(orderData.attachments || []), ...uploadedUrls],
    }

    if (existingIndex >= 0) {
      await updateDoc(doc(db, 'removalOrders', id), finalData)
    } else {
      await addDoc(collection(db, 'removalOrders'), finalData)
    }
  }

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Pagination states
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const INITIAL_DISPLAY_LIMIT = 5

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query) ||
          order.postcode.toLowerCase().includes(query) ||
          order.address.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Date range filter
    if (fromDate) {
      result = result.filter((order) => order.removalDate >= fromDate)
    }
    if (toDate) {
      result = result.filter((order) => order.removalDate <= toDate)
    }

    // Priority sort: pending nearest to today first, then non-pending newest first
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    result.sort((a, b) => {
      const aPending = a.status === 'pending'
      const bPending = b.status === 'pending'
      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1
      const aDate = new Date(a.removalDate).getTime()
      const bDate = new Date(b.removalDate).getTime()
      if (aPending && bPending) {
        return Math.abs(aDate - today.getTime()) - Math.abs(bDate - today.getTime())
      }
      return bDate - aDate
    })

    return result
  }, [orders, searchQuery, statusFilter, fromDate, toDate])

  // Export to Excel
  const handleExport = (month: number, year: number) => {
    // Filter orders by selected month and year
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.removalDate)
      return orderDate.getMonth() === month && orderDate.getFullYear() === year
    })

    // Prepare order data for export
    const orderData = monthOrders.map((order, index) => ({
      'No.': index + 1,
      'Customer Name': order.customerName,
      'Email': order.email,
      'Phone': order.phone,
      'Address': order.address,
      'Postcode': order.postcode,
      'Removal Date': order.removalDate,
      'Time': `${order.startTime} - ${order.endTime}`,
      'Total Price': parseFloat(order.totalPrice),
      'Advance': parseFloat(order.advance),
      'Balance': parseFloat(order.totalPrice) - parseFloat(order.advance),
      'Payment Method': order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1),
      'Status': order.status.charAt(0).toUpperCase() + order.status.slice(1),
      'Notes': order.notes || '-',
    }))

    // Calculate totals for the selected month
    const monthlyTotal = monthOrders.reduce((sum, order) => sum + parseFloat(order.totalPrice), 0)
    const monthlyAdvance = monthOrders.reduce((sum, order) => sum + parseFloat(order.advance), 0)
    const monthlyBalance = monthlyTotal - monthlyAdvance
    const pendingCount = monthOrders.filter(o => o.status === 'pending').length
    const completedCount = monthOrders.filter(o => o.status === 'completed').length

    // Prepare summary data
    const summaryData = [
      ['Removal Order Summary', ''],
      ['Total Orders', monthOrders.length],
      ['Pending', pendingCount],
      ['Completed', completedCount],
      ['', ''],
      ['Financial Summary', ''],
      ['Total Revenue', monthlyTotal],
      ['Total Advance', monthlyAdvance],
      ['Total Balance', monthlyBalance],
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create orders sheet
    const wsOrders = XLSX.utils.json_to_sheet(orderData)
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Removal Orders')

    // Create summary sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Generate filename with month and year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const filename = `RemovalOrders_${monthNames[month]}_${year}.xlsx`

    // Download file
    XLSX.writeFile(wb, filename)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setFromDate('')
    setToDate('')
  }

  // Calculate displayed orders based on showAll and pagination
  const displayedOrders = useMemo(() => {
    if (!showAll) {
      return filteredOrders.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, showAll, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  }, [filteredOrders.length])

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Removals</p>
          <h1 className="text-4xl font-semibold leading-tight">Orders</h1>
        </header>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
            title="Export to Excel"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button type="button" onClick={() => setIsCreateModalOpen(true)} className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10">
            New Removal
          </button>
        </div>
      </div>

      {/* Stats Cards - filtered by date range only (not search query) */}
      {(() => {
        // Apply only date filters for stats (not search query)
        let dateFilteredOrders = [...orders]
        if (fromDate) {
          dateFilteredOrders = dateFilteredOrders.filter((order) => order.removalDate >= fromDate)
        }
        if (toDate) {
          dateFilteredOrders = dateFilteredOrders.filter((order) => order.removalDate <= toDate)
        }
        const pendingCount = dateFilteredOrders.filter(o => o.status === 'pending').length
        const completedCount = dateFilteredOrders.filter(o => o.status === 'completed').length
        
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-stack-up delay-100">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
              <div className="flex flex-col gap-2 justify-center">
                <p className="text-sm font-semibold text-gray-400">Pending Removals</p>
                <p className="text-3xl font-bold text-white">{pendingCount}</p>
              </div>
              <div className="flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
              <div className="flex flex-col gap-2 justify-center">
                <p className="text-sm font-semibold text-gray-400">Completed Removals</p>
                <p className="text-3xl font-bold text-white">{completedCount}</p>
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Search, Filter, and Sort Controls */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 w-full animate-stack-up delay-200">
        {/* Search */}
        <div className="relative w-1/2 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, postcode..."
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

        {/* Status Filter */}
        <StatusDropdown value={statusFilter} onChange={setStatusFilter} />

        {/* Date Range Filter */}
        <DatePicker value={fromDate} onChange={setFromDate} placeholder="From date" />
        <DatePicker value={toDate} onChange={setToDate} placeholder="To date" />

        {/* Clear Filters */}
        {(searchQuery || statusFilter !== 'all' || fromDate || toDate) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-300 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {!showAll && filteredOrders.length > INITIAL_DISPLAY_LIMIT
          ? `Showing ${Math.min(INITIAL_DISPLAY_LIMIT, filteredOrders.length)} of ${filteredOrders.length} orders`
          : `Showing ${filteredOrders.length} of ${orders.length} orders`}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 animate-stack-up delay-300">
          <p className="text-sm">
            {orders.length === 0
              ? 'No orders yet. Start by creating a new removal order.'
              : 'No orders match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl animate-stack-up delay-300">
          <div className="overflow-x-auto rounded-3xl">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-base font-semibold">Customer Name</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Phone Number</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Postcode</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-base">{order.customerName}</td>
                    <td className="px-4 py-3 text-base">{order.phone}</td>
                    <td className="px-4 py-3 text-base">{order.postcode}</td>
                    <td className="px-4 py-3 text-base">
                      {order.status === 'pending'
                        ? <Clock className="w-5 h-5 text-orange-400" />
                        : <CheckCircle2 className="w-5 h-5 text-green-400" />}
                    </td>
                    <td className="px-4 py-3 text-base">{order.removalDate}</td>
                    <td className="px-4 py-3 text-base">£{order.totalPrice}</td>
                    <td className="px-4 py-3 text-base">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(order)}
                          className="p-1.5 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(order)}
                          className="p-1.5 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(order)}
                          className="p-1.5 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show All / Show Less Button */}
      {!showAll && filteredOrders.length > INITIAL_DISPLAY_LIMIT && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(true)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            Show All ({filteredOrders.length} orders)
          </button>
        </div>
      )}

      {showAll && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(false)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            Show Less (Last {Math.min(INITIAL_DISPLAY_LIMIT, filteredOrders.length)})
          </button>
        </div>
      )}

      {/* Pagination - only show when showing all and there are multiple pages */}
      {showAll && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <NewRemovalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveOrder}
      />

      <RemovalViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
      />

      <NewRemovalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedOrder(null)
        }}
        onSave={handleSaveOrder}
        editRemoval={selectedOrder ? (({ id: _id, ...rest }) => rest)(selectedOrder) : null}
        editId={selectedOrder?.id ?? null}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedOrder(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Removal Order"
        itemName={selectedOrder ? selectedOrder.customerName : ''}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Export Removal Orders"
      />
    </section>
  )
}
