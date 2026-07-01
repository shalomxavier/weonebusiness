import { X, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Check, Paperclip, FileText } from 'lucide-react'
import { FormEvent, useEffect, useState, useRef } from 'react'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'

interface Expense {
  id: string
  type: string
  mode: string
  amount: string
  date: string
  notes: string
  billUrl?: string
}

interface NewExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (expense: Omit<Expense, 'id'>) => void
  editExpense?: Expense | null
}

const EXPENSE_MODES = ['Cash', 'Bank Payment']

const EXPENSE_TYPES = [
  'Diesel',
  'Salary',
  'Cleaning Maintenance',
  'Rent',
  'Food',
  'Insurance',
  'Vehicle Maintenance',
  'Refund',
  'Advertisement',
  'VAT',
  'HMRC Tax',
  'Other',
]

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function CustomSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedLabel = value ? options.find(opt => opt === value) || '' : ''

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-between"
      >
        <span className={!selectedLabel ? 'text-gray-500' : ''}>
          {selectedLabel ? selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1) : (placeholder ?? 'Select expense type')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-black border border-white/10 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false) }}
              className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between ${
                value === option
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
              {value === option && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewExpenseModal({ isOpen, onClose, onSave, editExpense }: NewExpenseModalProps) {
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    type: '',
    mode: '',
    amount: '',
    date: getTodayDate(),
    notes: '',
    billUrl: '',
  })
  const [billFile, setBillFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setBillFile(null)
    if (editExpense) {
      setFormData({
        type: editExpense.type,
        mode: editExpense.mode || '',
        amount: editExpense.amount,
        date: editExpense.date,
        notes: editExpense.notes,
        billUrl: editExpense.billUrl || '',
      })
    } else {
      setFormData({
        type: '',
        mode: '',
        amount: '',
        date: getTodayDate(),
        notes: '',
        billUrl: '',
      })
    }
  }, [editExpense])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!billFile && !formData.billUrl) return
    let billUrl = formData.billUrl || ''
    if (billFile) {
      setUploading(true)
      try {
        const ext = billFile.name.split('.').pop()
        const path = `expense-bills/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const snap = await uploadBytes(storageRef(storage, path), billFile)
        billUrl = await getDownloadURL(snap.ref)
      } finally {
        setUploading(false)
      }
    }
    if (onSave) {
      onSave({ ...formData, billUrl })
    }
    onClose()
    setBillFile(null)
    setFormData({
      type: '',
      mode: '',
      amount: '',
      date: getTodayDate(),
      notes: '',
      billUrl: '',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

function DatePicker({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  const toDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }
  const toISO = (display: string) => {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
    if (!match) return ''
    const [, d, m, yy] = match
    const year = parseInt(yy) >= 0 ? `20${yy}` : ''
    return `${year}-${m}-${d}`
  }

  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState(() => toDisplay(value))
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setTyped(toDisplay(value)) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleTyped = (raw: string) => {
    setTyped(raw)
    if (raw === '') { onChange(''); return }
    const iso = toISO(raw)
    if (iso && !isNaN(new Date(iso).getTime())) {
      const d = new Date(iso)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      onChange(iso)
    }
  }

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
    setTyped(toDisplay(iso))
    setOpen(false)
  }
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500">
        <input
          type="text"
          value={typed}
          onChange={(e) => handleTyped(e.target.value)}
          placeholder="DD/MM/YY"
          required={required}
          className="flex-1 px-3 py-2 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none rounded-2xl"
        />
        <button type="button" onClick={() => setOpen(p => !p)} className="pr-3 text-gray-400 hover:text-gray-200">
          <CalendarDays className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="absolute z-[60] mt-1 left-0 w-72 bg-black border border-white/10 rounded-3xl shadow-xl p-4">
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
                <button key={i} type="button" onClick={() => select(day)}
                  className={`w-8 h-8 mx-auto rounded-xl text-xs font-medium transition-colors ${
                    isSelected ? 'bg-purple-600 text-white' :
                    isToday ? 'ring-1 ring-white/20 text-white' :
                    'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}>{day}</button>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-xs text-gray-400 hover:text-white">Clear</button>
            <button type="button" onClick={() => { onChange(todayStr); setOpen(false) }} className="text-xs text-purple-400 hover:text-purple-300">Today</button>
          </div>
        </div>
      )}
    </div>
  )
}

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">{editExpense ? 'Edit Expense' : 'New Expense'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Expense Type
              </label>
              <CustomSelect
                value={formData.type}
                onChange={(v) => setFormData(p => ({ ...p, type: v }))}
                options={EXPENSE_TYPES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expense Mode</label>
              <CustomSelect
                value={formData.mode}
                onChange={(v) => setFormData(p => ({ ...p, mode: v }))}
                options={EXPENSE_MODES}
                placeholder="Select expense mode"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter amount"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <DatePicker
                value={formData.date}
                onChange={(v) => setFormData(p => ({ ...p, date: v }))}
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter additional notes..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Document <span className="text-red-400">*</span></label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-3 w-full px-3 py-2 bg-black/40 backdrop-blur-xl border rounded-2xl text-gray-300 cursor-pointer hover:border-purple-500/50 transition-colors ${!billFile && !formData.billUrl ? 'border-red-500/40' : 'border-white/10'}`}
              >
                {billFile ? (
                  <>
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-sm truncate flex-1">{billFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBillFile(null) }}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : formData.billUrl ? (
                  <>
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                    <a
                      href={formData.billUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-purple-400 hover:text-purple-300 truncate flex-1"
                    >
                      View existing bill
                    </a>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, billUrl: '' })) }}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-500">Upload document</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) setBillFile(e.target.files[0]) }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : editExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
