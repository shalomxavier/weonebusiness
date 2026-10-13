import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Pencil, Trash2, Clock, CheckCircle2, XCircle, Search, X, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Download, Loader2 } from 'lucide-react'
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import NewOrderModal from './NewOrderModal'
import OrderViewModal from './OrderViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import ExportModal from './ExportModal'
import ExcelJS from 'exceljs'

interface Order {
  id: string
  itemNumber: string
  itemName: string
  price: string
  advance: string
  advanceDate: string
  customerName: string
  phone: string
  address: string
  postcode: string
  deliveryDate: string
  deliveryStartTime: string
  deliveryEndTime: string
  additionalNotes: string
  paymentMethod: 'card' | 'cash' | 'both'
  status: 'pending' | 'delivered' | 'cancelled'
  cardAmount?: string
  cashAmount?: string
  attachments?: string[]
}

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const defaultFromDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toISODate(d)
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

function StatusDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (v: 'all' | 'pending' | 'delivered' | 'cancelled') => void
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

export default function UsedOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('deliveryDate', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        paymentMethod: 'card',
        id: doc.id,
        ...doc.data(),
      })) as Order[]
      setOrders(ordersData)
      setDataReady(true)
    }, () => setLoading(false))
    return () => unsubscribe()
  }, [])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all')
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState('')

  // Pagination states
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const INITIAL_DISPLAY_LIMIT = 5

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.itemName.toLowerCase().includes(query) ||
          order.itemNumber.toLowerCase().includes(query) ||
          order.address.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Date range filter
    if (fromDate) {
      result = result.filter((order) => order.deliveryDate >= fromDate)
    }
    if (toDate) {
      result = result.filter((order) => order.deliveryDate <= toDate)
    }

    // Priority sort: overdue pending first, then future pending nearest to today, then non-pending newest first
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTime = today.getTime()
    result.sort((a, b) => {
      const aPending = a.status === 'pending'
      const bPending = b.status === 'pending'
      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1
      const aDate = new Date(a.deliveryDate).getTime()
      const bDate = new Date(b.deliveryDate).getTime()
      if (aPending && bPending) {
        const aOverdue = aDate < todayTime
        const bOverdue = bDate < todayTime
        // Both overdue: sort by most overdue first (further in past = higher priority)
        if (aOverdue && bOverdue) {
          return aDate - bDate // Earlier date first (more overdue)
        }
        // One overdue, one not: overdue first
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1
        // Neither overdue: closest to today first
        return Math.abs(aDate - todayTime) - Math.abs(bDate - todayTime)
      }
      return bDate - aDate
    })

    return result
  }, [orders, searchQuery, statusFilter, fromDate, toDate])

  // Export to Excel
  const handleExport = async (month: number, year: number) => {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const gbp = (n: number) => `£${n.toFixed(2)}`

    // Filter orders by selected month and year
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.deliveryDate)
      return orderDate.getMonth() === month && orderDate.getFullYear() === year
    })

    const monthAdvances = orders.filter(order => {
      if (!order.advanceDate || order.status === 'cancelled') return false
      const advanceDate = new Date(`${order.advanceDate.split('T')[0]}T00:00:00`)
      return advanceDate.getMonth() === month && advanceDate.getFullYear() === year && (parseFloat(order.advance) || 0) > 0
    })

    // Calculate totals for the selected month
    const monthlyTotal = monthOrders.reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0)
    const monthlyAdvance = monthAdvances.reduce((sum, order) => sum + (parseFloat(order.advance) || 0), 0)
    const monthlyBalance = monthOrders.reduce((sum, order) => sum + Math.max(0, (parseFloat(order.price) || 0) - (parseFloat(order.advance) || 0)), 0)
    const HEADER_BG = 'FF6A1B9A'
    const HEADER_FG = 'FFFFFFFF'
    const TOTAL_BG = 'FFE8D5F5'
    const TOTAL_FG = 'FF4A148C'
    const ALT_BG = 'FFF3E5FF'
    const DEF_BG = 'FFFFFFFF'
    const DEF_FG = 'FF212121'
    const BORDER_COLOR = 'FFCE93D8'

    const thinBorder = (): Partial<ExcelJS.Borders> => ({
      top: { style: 'thin', color: { argb: BORDER_COLOR } },
      left: { style: 'thin', color: { argb: BORDER_COLOR } },
      bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
      right: { style: 'thin', color: { argb: BORDER_COLOR } },
    })

    const styleHeader = (row: ExcelJS.Row) => {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } }
        cell.font = { bold: true, color: { argb: HEADER_FG }, size: 14 }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        cell.border = thinBorder()
      })
      row.height = 22
    }

    const styleData = (row: ExcelJS.Row, altRow: boolean, colAlign: (col: number) => ExcelJS.Alignment['horizontal']) => {
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow ? ALT_BG : DEF_BG } }
        cell.font = { color: { argb: DEF_FG }, size: 12 }
        cell.alignment = { vertical: 'middle', horizontal: colAlign(col) }
        cell.border = thinBorder()
      })
      row.height = 18
    }

    const styleTotal = (row: ExcelJS.Row, rightCols: number[]) => {
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } }
        cell.font = { bold: true, color: { argb: TOTAL_FG }, size: 14 }
        cell.alignment = { vertical: 'middle', horizontal: rightCols.includes(col) ? 'right' : 'left' }
        cell.border = thinBorder()
      })
      row.height = 20
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = 'We One Business'

    // Split orders by payment method
    const isInSelectedMonth = (dateStr: string) => {
      const d = new Date(`${dateStr.split('T')[0]}T00:00:00`)
      return d.getMonth() === month && d.getFullYear() === year
    }

    type PaymentRow = { itemNumber: string; itemName: string; customerName: string; date: string; type: 'Delivered' | 'Advance'; amount: number }
    const cardRows: PaymentRow[] = []
    const cashRows: PaymentRow[] = []

    const addBothRows = (order: Order, rowType: 'Delivered' | 'Advance', total: number, date: string) => {
      const cardAmt = parseFloat(order.cardAmount || '') || 0
      const cashAmt = parseFloat(order.cashAmount || '') || 0
      if (cardAmt > 0 || cashAmt > 0) {
        if (cardAmt > 0) cardRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date, type: rowType, amount: cardAmt })
        if (cashAmt > 0) cashRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date, type: rowType, amount: cashAmt })
      } else {
        // Legacy data fallback: split 50/50
        cardRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date, type: rowType, amount: total / 2 })
        cashRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date, type: rowType, amount: total / 2 })
      }
    }

    monthOrders.forEach(order => {
      if (order.status === 'cancelled') return
      const deliveredAmount = Math.max(0, (parseFloat(order.price) || 0) - (parseFloat(order.advance) || 0))

      if (order.status === 'delivered') {
        if (order.paymentMethod === 'card') {
          cardRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date: order.deliveryDate, type: 'Delivered', amount: deliveredAmount })
        } else if (order.paymentMethod === 'cash') {
          cashRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date: order.deliveryDate, type: 'Delivered', amount: deliveredAmount })
        } else if (order.paymentMethod === 'both') {
          addBothRows(order, 'Delivered', deliveredAmount, order.deliveryDate)
        }
      }

      if (order.advanceDate && isInSelectedMonth(order.advanceDate) && (parseFloat(order.advance) || 0) > 0) {
        const advanceAmount = parseFloat(order.advance) || 0
        if (order.paymentMethod === 'card') {
          cardRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date: order.advanceDate, type: 'Advance', amount: advanceAmount })
        } else if (order.paymentMethod === 'cash') {
          cashRows.push({ itemNumber: order.itemNumber, itemName: order.itemName, customerName: order.customerName, date: order.advanceDate, type: 'Advance', amount: advanceAmount })
        } else if (order.paymentMethod === 'both') {
          addBothRows(order, 'Advance', advanceAmount, order.advanceDate)
        }
      }
    })

    const cardRevenue = cardRows.reduce((sum, r) => sum + r.amount, 0)
    const cashRevenue = cashRows.reduce((sum, r) => sum + r.amount, 0)

    const buildOrderSheet = (ws: ExcelJS.Worksheet, data: Order[], priceTotal: number, balanceTotal: number) => {
      const columns = [
        { width: 6 }, { width: 14 }, { width: 22 }, { width: 12 }, { width: 12 },
        { width: 22 }, { width: 14 }, { width: 30 }, { width: 12 }, { width: 14 },
        { width: 16 }, { width: 14 }, { width: 12 }, { width: 30 },
      ]
      const headers = ['No.', 'Item Number', 'Item Name', 'Price', 'Balance', 'Customer Name', 'Phone', 'Address', 'Postcode', 'Delivery Date', 'Delivery Time', 'Payment Method', 'Status', 'Notes']
      ws.columns = columns

      const orderAlign = (col: number): ExcelJS.Alignment['horizontal'] => {
        if (col === 4 || col === 5) return 'right'
        if (col === 10) return 'center'
        return 'left'
      }

      styleHeader(ws.addRow(headers))
      data.forEach((order, i) => {
        const row = ws.addRow([
          i + 1,
          order.itemNumber,
          order.itemName,
          gbp(parseFloat(order.price) || 0),
          gbp(Math.max(0, (parseFloat(order.price) || 0) - (parseFloat(order.advance) || 0))),
          order.customerName,
          order.phone,
          order.address,
          order.postcode,
          order.deliveryDate,
          `${order.deliveryStartTime} - ${order.deliveryEndTime}`,
          cap(order.paymentMethod),
          cap(order.status),
          order.additionalNotes || '',
        ])
        styleData(row, i % 2 === 1, orderAlign)
      })
      ws.addRow([])
      styleTotal(ws.addRow(['', 'TOTAL', '', gbp(priceTotal), gbp(balanceTotal), '', '', '', '', '', '', '', '', '', '']), [4, 5])
    }

    const buildPaymentSheet = (ws: ExcelJS.Worksheet, rows: PaymentRow[], revenueTotal: number) => {
      ws.columns = [
        { width: 6 }, { width: 14 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 12 }, { width: 12 },
      ]
      const paymentAlign = (col: number): ExcelJS.Alignment['horizontal'] => {
        if (col === 7) return 'right'
        if (col === 5) return 'center'
        return 'left'
      }
      styleHeader(ws.addRow(['No.', 'Item Number', 'Item Name', 'Customer Name', 'Date', 'Type', 'Amount']))
      rows.forEach((r, i) => {
        const row = ws.addRow([i + 1, r.itemNumber, r.itemName, r.customerName, r.date, r.type, gbp(r.amount)])
        styleData(row, i % 2 === 1, paymentAlign)
      })
      ws.addRow([])
      styleTotal(ws.addRow(['', 'TOTAL', '', '', '', '', gbp(revenueTotal)]), [7])
    }

    // Orders sheet
    const wsOrders = wb.addWorksheet('Orders')
    buildOrderSheet(wsOrders, monthOrders, monthlyTotal, monthlyBalance)

    // Card Payments sheet
    const wsCard = wb.addWorksheet('Card Payments')
    buildPaymentSheet(wsCard, cardRows, cardRevenue)

    // Cash Payments sheet
    const wsCash = wb.addWorksheet('Cash Payments')
    buildPaymentSheet(wsCash, cashRows, cashRevenue)

    // Advances sheet
    const wsAdvances = wb.addWorksheet('Advances')
    wsAdvances.columns = [
      { width: 6 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 22 },
      { width: 12 }, { width: 16 }, { width: 12 },
    ]
    const advanceAlign = (col: number): ExcelJS.Alignment['horizontal'] => {
      if (col === 6) return 'right'
      if (col === 2) return 'center'
      return 'left'
    }
    styleHeader(wsAdvances.addRow(['No.', 'Advance Date', 'Item Number', 'Item Name', 'Customer Name', 'Advance', 'Payment Method', 'Status']))
    monthAdvances.forEach((order, i) => {
      const row = wsAdvances.addRow([
        i + 1,
        order.advanceDate,
        order.itemNumber,
        order.itemName,
        order.customerName,
        gbp(parseFloat(order.advance) || 0),
        cap(order.paymentMethod),
        cap(order.status),
      ])
      styleData(row, i % 2 === 1, advanceAlign)
    })
    wsAdvances.addRow([])
    styleTotal(wsAdvances.addRow(['', 'TOTAL', '', '', '', gbp(monthlyAdvance), '', '']), [6])

    // Summary sheet
    const wsSummary = wb.addWorksheet('Summary')
    wsSummary.columns = [{ width: 26 }, { width: 16 }]
    const sumAlign = (col: number): ExcelJS.Alignment['horizontal'] => col === 2 ? 'right' : 'left'
    styleHeader(wsSummary.addRow(['Payment Summary', '']))
    ;([
      ['Card Revenue', gbp(cardRevenue)],
      ['Cash Revenue', gbp(cashRevenue)],
      ['Total Payment Revenue', gbp(cardRevenue + cashRevenue)],
    ] as [string, string][]).forEach((r, i) => {
      styleData(wsSummary.addRow(r), i % 2 === 1, sumAlign)
    })

    // Generate filename with month and year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Orders_${monthNames[month]}_${year}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setFromDate(defaultFromDate())
    setToDate('')
  }

  const isDefaultDateRange = fromDate === defaultFromDate() && toDate === ''

  // Calculate displayed orders based on showAll and pagination
  const displayedOrders = useMemo(() => {
    if (!showAll) {
      return filteredOrders.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, showAll, currentPage])

  // Keep the spinner until the first filtered/sliced render is computed
  useEffect(() => {
    if (dataReady && loading) setLoading(false)
  }, [dataReady, loading, displayedOrders])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  }, [filteredOrders.length])

  const handleView = (order: Order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleEdit = (order: Order) => {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  const handleDelete = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedOrder) {
      await deleteDoc(doc(db, 'orders', selectedOrder.id))
    }
    setIsDeleteModalOpen(false)
    setSelectedOrder(null)
  }

  const handleSaveOrder = async (order: Order, newFiles: File[] = []) => {
    const { id, ...orderData } = order
    const existingIndex = orders.findIndex((o) => o.id === id)

    const uploadedUrls: string[] = []
    for (const file of newFiles) {
      const fileRef = storageRef(storage, `orders/${id || Date.now()}_${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(fileRef, file)
      const url = await getDownloadURL(snapshot.ref)
      uploadedUrls.push(url)
    }

    const finalData = {
      ...orderData,
      attachments: [...(orderData.attachments || []), ...uploadedUrls],
    }

    if (existingIndex >= 0) {
      await updateDoc(doc(db, 'orders', id), finalData)
    } else {
      await addDoc(collection(db, 'orders'), finalData)
    }
  }

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Used Goods</p>
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
            New Order
          </button>
        </div>
      </div>

      {/* Stats Cards - filtered by date range only (not search query) */}
      {(() => {
        // Apply only date filters for stats (not search query or status filter)
        let dateFilteredOrders = [...orders]
        if (fromDate) {
          dateFilteredOrders = dateFilteredOrders.filter((order) => order.deliveryDate >= fromDate)
        }
        if (toDate) {
          dateFilteredOrders = dateFilteredOrders.filter((order) => order.deliveryDate <= toDate)
        }
        const pendingCount = dateFilteredOrders.filter(o => o.status === 'pending').length
        const deliveredCount = dateFilteredOrders.filter(o => o.status === 'delivered').length
        const cancelledCount = dateFilteredOrders.filter(o => o.status === 'cancelled').length
        
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stack-up delay-100">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
              <div className="flex flex-col gap-2 justify-center">
                <p className="text-sm font-semibold text-gray-400">Pending Orders</p>
                <p className="text-3xl font-bold text-white">{pendingCount}</p>
              </div>
              <div className="flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
              <div className="flex flex-col gap-2 justify-center">
                <p className="text-sm font-semibold text-gray-400">Delivered Orders</p>
                <p className="text-3xl font-bold text-white">{deliveredCount}</p>
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4">
              <div className="flex flex-col gap-2 justify-center">
                <p className="text-sm font-semibold text-gray-400">Cancelled Orders</p>
                <p className="text-3xl font-bold text-white">{cancelledCount}</p>
              </div>
              <div className="flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
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
            placeholder="Search by customer, item, address..."
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
        {(searchQuery || statusFilter !== 'all' || !isDefaultDateRange) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
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

      {loading ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-10 flex items-center justify-center animate-stack-up delay-300">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 animate-stack-up delay-300">
          <p className="text-sm">
            {orders.length === 0
              ? 'No orders yet. Start by creating a new order.'
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
                  <th className="text-left px-4 py-3 text-base font-semibold">Delivery Date</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Item Number</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Item Name</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Price</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Address</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Postcode</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-base">{order.customerName}</td>
                    <td className="px-4 py-3 text-base">{order.deliveryDate}</td>
                    <td className="px-4 py-3 text-base">{order.itemNumber}</td>
                    <td className="px-4 py-3 text-base">{order.itemName}</td>
                    <td className="px-4 py-3 text-base">£{order.price}</td>
                    <td className="px-4 py-3 text-base">{order.address}</td>
                    <td className="px-4 py-3 text-base">{order.postcode}</td>
                    <td className="px-4 py-3 text-base">
                      {order.status === 'pending'
                        ? <Clock className="w-5 h-5 text-orange-400" />
                        : order.status === 'delivered'
                        ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                        : <XCircle className="w-5 h-5 text-red-500" />}
                    </td>
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

      <NewOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveOrder}
      />

      <NewOrderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedOrder(null)
        }}
        editOrder={selectedOrder}
        onSave={handleSaveOrder}
      />

      <OrderViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedOrder(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Order"
        itemName={selectedOrder ? `${selectedOrder.itemName} - ${selectedOrder.customerName}` : ''}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Export Orders"
      />
    </section>
  )
}
