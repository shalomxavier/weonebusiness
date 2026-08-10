import { useState } from 'react'
import { X } from 'lucide-react'

interface BaseExportModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
}

interface MonthExportModalProps extends BaseExportModalProps {
  mode?: 'month'
  onExport: (month: number, year: number) => void
}

interface RangeExportModalProps extends BaseExportModalProps {
  mode: 'range'
  onExport: (fromDate: string, toDate: string) => void
}

export type ExportModalProps = MonthExportModalProps | RangeExportModalProps

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const getLocalISODate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getFirstOfMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  title = 'Export Data',
  mode = 'month',
}: ExportModalProps) {
  const today = getLocalISODate(new Date())

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [fromDate, setFromDate] = useState(getFirstOfMonth())
  const [toDate, setToDate] = useState(today)

  if (!isOpen) return null

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  const handleExport = () => {
    if (mode === 'range') {
      (onExport as (fromDate: string, toDate: string) => void)(fromDate, toDate)
    } else {
      (onExport as (month: number, year: number) => void)(selectedMonth, selectedYear)
    }
    onClose()
  }

  const isRangeValid = fromDate <= toDate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

        <div className="space-y-4">
          {mode === 'range' ? (
            <>
              <div>
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label htmlFor="toDate" className="block text-sm font-medium text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {!isRangeValid && (
                <p className="text-sm text-red-400">From date must be before or equal to To date</p>
              )}
            </>
          ) : (
            <>
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-300 mb-2">
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index} className="bg-gray-900">
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-2">
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year} className="bg-gray-900">
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleExport}
            disabled={mode === 'range' && !isRangeValid}
            className={`w-full mt-6 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-base font-medium transition-colors ${
              mode === 'range' && !isRangeValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
