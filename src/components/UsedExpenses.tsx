import { useEffect, useMemo, useState } from 'react'
import { Search, X, Download, Eye, Pencil, Trash2 } from 'lucide-react'
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import * as XLSX from 'xlsx'
import NewExpenseModal from './NewExpenseModal'
import ExpenseViewModal from './ExpenseViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const EXPENSE_TYPES = [
  'all',
  'diesel',
  'salary',
  'cleaning maintenance',
  'rent',
  'food',
  'insurance',
  'other',
]

interface Expense {
  id: string
  type: string
  amount: string
  date: string
  notes: string
}

export default function UsedExpenses() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[]
      setExpenses(expensesData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSaveExpense = async (expense: Omit<Expense, 'id'>) => {
    await addDoc(collection(db, 'expenses'), {
      type: expense.type,
      amount: expense.amount,
      date: expense.date,
      notes: expense.notes,
    })
  }

  const handleEditSave = async (expense: Omit<Expense, 'id'>) => {
    if (selectedExpense) {
      await updateDoc(doc(db, 'expenses', selectedExpense.id), {
        type: expense.type,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes,
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
  const handleExport = () => {
    // Prepare expense data for export
    const expenseData = filteredExpenses.map((expense, index) => ({
      'No.': index + 1,
      'Type': expense.type.charAt(0).toUpperCase() + expense.type.slice(1),
      'Amount': parseFloat(expense.amount),
      'Date': expense.date,
      'Notes': expense.notes || '-',
    }))

    // Prepare summary data
    const summaryData = [
      ['Summary by Type', ''],
      ['Type', 'Total'],
      ...Object.entries(totalsByType).map(([type, total]) => [
        type.charAt(0).toUpperCase() + type.slice(1),
        total,
      ]),
      ['', ''],
      ['Grand Total', grandTotal],
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create expenses sheet
    const wsExpenses = XLSX.utils.json_to_sheet(expenseData)
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses')

    // Create summary sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Generate filename with date range
    const fromStr = fromDate || 'start'
    const toStr = toDate || 'end'
    const filename = `Expenses_${fromStr}_to_${toStr}.xlsx`

    // Download file
    XLSX.writeFile(wb, filename)
  }

  return (
    <section className="flex-1 p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Used Goods</p>
          <h1 className="text-3xl font-semibold leading-tight">Expenses</h1>
        </header>
        <button
          type="button"
          className="btn border"
          onClick={() => setIsModalOpen(true)}
        >
          New Expense
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by type or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          {EXPENSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          />
          <span className="text-sm text-gray-500">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('')
                setToDate('')
              }}
              className="p-1 rounded-full hover:bg-gray-100"
              title="Clear dates"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Clear Filters */}
        {(searchQuery || typeFilter !== 'all' || fromDate || toDate) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}

        {/* Export Button - only shows when date range is selected */}
        {fromDate && toDate && filteredExpenses.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Export to Excel"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {loading ? (
        <div className="border rounded-lg p-6">
          <p className="text-sm">Loading expenses...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-sm">
            {expenses.length === 0
              ? 'No expenses yet. Start by creating a new expense.'
              : 'No expenses match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Notes</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-sm capitalize">{expense.type}</td>
                    <td className="px-4 py-3 text-sm">${expense.amount}</td>
                    <td className="px-4 py-3 text-sm">{expense.date}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{expense.notes || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(expense)}
                          className="p-1.5 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
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
      {!showAll && filteredExpenses.length > INITIAL_DISPLAY_LIMIT && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(true)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
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
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
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
            className="px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        itemName={selectedExpense ? `${selectedExpense.type} - $${selectedExpense.amount}` : ''}
      />
    </section>
  )
}
