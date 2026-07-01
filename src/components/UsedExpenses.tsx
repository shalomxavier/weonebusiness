import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, Download, Eye, Pencil, Trash2, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, TrendingUp } from 'lucide-react'
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import ExcelJS from 'exceljs'
import NewExpenseModal from './NewExpenseModal'
import ExpenseViewModal from './ExpenseViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import ExportModal from './ExportModal'

const EXPENSE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'salary', label: 'Salary' },
  { value: 'cleaning maintenance', label: 'Cleaning Maintenance' },
  { value: 'rent', label: 'Rent' },
  { value: 'food', label: 'Food' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
] as const

interface Expense {
  id: string
  type: string
  mode: string
  amount: string
  date: string
  notes: string
  billUrl?: string
}

function TypeDropdown({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
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

  const selected = EXPENSE_TYPES.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative flex-1 min-w-[160px]">
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
          {EXPENSE_TYPES.map((opt) => (
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
    <div ref={ref} className="relative flex-1 min-w-[140px]">
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

export default function UsedExpenses() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
    })
    return () => unsubscribe()
  }, [])

  const handleSaveExpense = async (expense: Omit<Expense, 'id'>) => {
    await addDoc(collection(db, 'expenses'), {
      type: expense.type,
      mode: expense.mode,
      amount: expense.amount,
      date: expense.date,
      notes: expense.notes,
      billUrl: expense.billUrl || '',
    })
  }

  const handleEditSave = async (expense: Omit<Expense, 'id'>) => {
    if (selectedExpense) {
      await updateDoc(doc(db, 'expenses', selectedExpense.id), {
        type: expense.type,
        mode: expense.mode,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes,
        billUrl: expense.billUrl || '',
      })
    }
  }

  const handleView = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsViewModalOpen(true)
  }

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsEditModalOpen(true)
  }

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedExpense) {
      await deleteDoc(doc(db, 'expenses', selectedExpense.id))
    }
    setIsDeleteModalOpen(false)
    setSelectedExpense(null)
  }

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Pagination states
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const INITIAL_DISPLAY_LIMIT = 5

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (expense) =>
          expense.type.toLowerCase().includes(query) ||
          expense.notes.toLowerCase().includes(query)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((expense) => expense.type === typeFilter)
    }

    // Date range filter
    if (fromDate) {
      result = result.filter((expense) => expense.date >= fromDate)
    }
    if (toDate) {
      result = result.filter((expense) => expense.date <= toDate)
    }

    return result
  }, [expenses, searchQuery, typeFilter, fromDate, toDate])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setFromDate('')
    setToDate('')
  }

  // Calculate totals by type
  const totalsByType = useMemo(() => {
    const totals: Record<string, number> = {}
    filteredExpenses.forEach((expense) => {
      const amount = parseFloat(expense.amount) || 0
      totals[expense.type] = (totals[expense.type] || 0) + amount
    })
    return totals
  }, [filteredExpenses])

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return Object.values(totalsByType).reduce((sum, val) => sum + val, 0)
  }, [totalsByType])

  // Calculate displayed expenses based on showAll and pagination
  const displayedExpenses = useMemo(() => {
    if (!showAll) {
      return filteredExpenses.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredExpenses, showAll, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE)
  }, [filteredExpenses.length])

  // Export to Excel
  const handleExport = async (month: number, year: number) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

    const monthExpenses = expenses.filter(expense => {
      const d = new Date(expense.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

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

    const colAlign = (col: number): ExcelJS.Alignment['horizontal'] => {
      if (col === 4) return 'right'   // Amount
      if (col === 5) return 'center'  // Date
      return 'left'
    }

    const styleData = (row: ExcelJS.Row, altRow: boolean) => {
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRow ? ALT_BG : DEF_BG } }
        cell.font = { color: { argb: DEF_FG }, size: 12 }
        cell.alignment = { vertical: 'middle', horizontal: colAlign(col) }
        cell.border = thinBorder()
      })
      row.height = 18
    }

    const styleTotal = (row: ExcelJS.Row, amountCol = 4) => {
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } }
        cell.font = { bold: true, color: { argb: TOTAL_FG }, size: 14 }
        cell.alignment = { vertical: 'middle', horizontal: col === amountCol ? 'right' : 'left' }
        cell.border = thinBorder()
      })
      row.height = 20
    }

    const buildModeSheet = (ws: ExcelJS.Worksheet, modeExpenses: typeof monthExpenses, modeName: string) => {
      ws.columns = [
        { key: 'no', width: 6 },
        { key: 'cat', width: 26 },
        { key: 'mode', width: 16 },
        { key: 'amount', width: 14 },
        { key: 'date', width: 14 },
        { key: 'notes', width: 36 },
      ]

      const headerRow = ws.addRow(['No.', 'Category', 'Mode', 'Amount', 'Date', 'Notes'])
      styleHeader(headerRow)

      const byCategory: Record<string, typeof monthExpenses> = {}
      modeExpenses.forEach(e => {
        const cat = cap(e.type)
        if (!byCategory[cat]) byCategory[cat] = []
        byCategory[cat].push(e)
      })

      let globalNo = 1
      let modeTotal = 0
      let dataRowIndex = 0

      Object.entries(byCategory).forEach(([cat, items]) => {
        items.forEach(e => {
          const amt = parseFloat(e.amount)
          const row = ws.addRow([globalNo++, cat, modeName, `£${amt.toFixed(2)}`, e.date, e.notes || '-'])
          styleData(row, dataRowIndex % 2 === 1)
          dataRowIndex++
          modeTotal += amt
        })
      })

      ws.addRow([])
      const totalRow = ws.addRow(['', 'TOTAL', '', `£${modeTotal.toFixed(2)}`, '', ''])
      styleTotal(totalRow)
    }

    const buildSummarySheet = (ws: ExcelJS.Worksheet, cashTotal: number, bankTotal: number, otherTotal: number, grandTotal: number) => {
      ws.columns = [
        { key: 'mode', width: 22 },
        { key: 'total', width: 16 },
      ]

      const headerRow = ws.addRow(['Payment Mode', 'Total'])
      styleHeader(headerRow)

      const rows = [
        ['Cash', `£${cashTotal.toFixed(2)}`],
        ['Bank Payment', `£${bankTotal.toFixed(2)}`],
        ...(otherTotal > 0 ? [['Unspecified', `£${otherTotal.toFixed(2)}`]] : []),
      ]
      rows.forEach((r, i) => {
        const row = ws.addRow(r)
        row.eachCell({ includeEmpty: true }, (cell, col) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 1 ? ALT_BG : DEF_BG } }
          cell.font = { color: { argb: DEF_FG }, size: 12 }
          cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'right' : 'left' }
          cell.border = thinBorder()
        })
        row.height = 18
      })

      ws.addRow([])
      const totalRow = ws.addRow(['Grand Total', `£${grandTotal.toFixed(2)}`])
      styleTotal(totalRow, 2)
    }

    const cashExpenses = monthExpenses.filter(e => (e.mode || '').toLowerCase() === 'cash')
    const bankExpenses = monthExpenses.filter(e => (e.mode || '').toLowerCase() === 'bank payment')
    const otherExpenses = monthExpenses.filter(e => !['cash', 'bank payment'].includes((e.mode || '').toLowerCase()))

    const cashTotal = cashExpenses.reduce((s, e) => s + parseFloat(e.amount), 0)
    const bankTotal = bankExpenses.reduce((s, e) => s + parseFloat(e.amount), 0)
    const otherTotal = otherExpenses.reduce((s, e) => s + parseFloat(e.amount), 0)
    const grandTotal = cashTotal + bankTotal + otherTotal

    const wb = new ExcelJS.Workbook()
    wb.creator = 'We One Business'
    buildModeSheet(wb.addWorksheet('Cash'), cashExpenses, 'Cash')
    buildModeSheet(wb.addWorksheet('Bank Payment'), bankExpenses, 'Bank Payment')
    if (otherExpenses.length > 0) buildModeSheet(wb.addWorksheet('Unspecified'), otherExpenses, 'Unspecified')
    buildSummarySheet(wb.addWorksheet('Summary'), cashTotal, bankTotal, otherTotal, grandTotal)

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Expenses_${monthNames[month]}_${year}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Used Goods</p>
          <h1 className="text-4xl font-semibold leading-tight">Expenses</h1>
        </header>
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
            title="Export to Excel"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            New Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stack-up delay-100">
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">Total Expenses</p>
            <p className="text-3xl font-bold text-white">{filteredExpenses.length}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-400">£</span>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">Grand Total</p>
            <p className="text-3xl font-bold text-white">£{grandTotal.toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-3xl font-bold text-green-400">£</span>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-5 flex items-stretch justify-between gap-4 hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-semibold text-gray-400">Avg Per Expense</p>
            <p className="text-3xl font-bold text-white">£{filteredExpenses.length > 0 ? (grandTotal / filteredExpenses.length).toFixed(2) : '0.00'}</p>
          </div>
          <div className="flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="relative z-10 flex flex-wrap items-center gap-4 w-full animate-stack-up delay-200">
        {/* Search */}
        <div className="relative w-1/2 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by type or notes..."
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

        {/* Type Filter */}
        <TypeDropdown value={typeFilter} onChange={setTypeFilter} />

        {/* Date Range Filter */}
        <DatePicker value={fromDate} onChange={setFromDate} placeholder="From date" />
        <DatePicker value={toDate} onChange={setToDate} placeholder="To date" />

        {/* Clear Filters */}
        {(searchQuery || typeFilter !== 'all' || fromDate || toDate) && (
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
        {!showAll && filteredExpenses.length > INITIAL_DISPLAY_LIMIT
          ? `Showing ${Math.min(INITIAL_DISPLAY_LIMIT, filteredExpenses.length)} of ${filteredExpenses.length} expenses`
          : `Showing ${filteredExpenses.length} of ${expenses.length} expenses`}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 animate-stack-up delay-300">
          <p className="text-sm">
            {expenses.length === 0
              ? 'No expenses yet. Start by creating a new expense.'
              : 'No expenses match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl animate-stack-up delay-300">
          <div className="overflow-x-auto rounded-3xl">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-base font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Notes</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 text-base capitalize">{expense.type}</td>
                    <td className="px-4 py-3 text-base">£{expense.amount}</td>
                    <td className="px-4 py-3 text-base">{expense.date}</td>
                    <td className="px-4 py-3 text-base max-w-xs truncate">{expense.notes || '-'}</td>
                    <td className="px-4 py-3 text-base">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(expense)}
                          className="p-1.5 rounded transition-colors hover:text-blue-400"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 rounded transition-colors hover:text-green-400"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
                          className="p-1.5 rounded transition-colors hover:text-red-400"
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
      {!showAll && filteredExpenses.length > INITIAL_DISPLAY_LIMIT && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(true)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
          >
            Show All ({filteredExpenses.length} expenses)
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
            Show Less (Last {Math.min(INITIAL_DISPLAY_LIMIT, filteredExpenses.length)})
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

      <NewExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
      />

      <NewExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedExpense(null)
        }}
        editExpense={selectedExpense}
        onSave={handleEditSave}
      />

      <ExpenseViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedExpense(null)
        }}
        expense={selectedExpense}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedExpense(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Expense"
        itemName={selectedExpense ? `${selectedExpense.type} - £${selectedExpense.amount}` : ''}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Export Expenses"
      />
    </section>
  )
}
