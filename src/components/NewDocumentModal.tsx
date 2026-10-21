import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { INVOICE_CATEGORY_LABELS, InvoiceCategory } from './InvoiceCategoryModal'
import { QUOTATION_TYPE_LABELS, QuotationType } from './QuotationTypeModal'

export type DocumentType = 'quotation' | 'invoice' | 'receipt'
export type YesNo = 'yes' | 'no'
export type PackingDay = 'same_day' | 'different_date'

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  quotation: 'Quotation',
  invoice: 'Invoice',
  receipt: 'Receipt',
}

export const DEFAULT_PACKING_DESCRIPTION = 'We will bring high quality boxes and packing materials.'

export const REMOVALS_QUOTATION_COMPANY_DETAILS = {
  companyName: 'We One Removals & Clearances Ltd',
  description: 'Nationwide services on house moves & house clearances',
  companyNumber: '16191726',
  wasteCarrierNumber: 'CBDU636583',
} as const

export interface MovingFromDetails {
  address: string
  bedrooms: string
  garage: YesNo
  garageNotes: string
  gardenShed: YesNo
  gardenShedNotes: string
  gardenFurniture: YesNo
  gardenFurnitureNotes: string
  dismantlingRequired: YesNo
  dismantlingNotes: string
}

export interface MovingToDetails {
  address: string
  bedrooms: string
  garage: YesNo
  garageNotes: string
  gardenShed: YesNo
  gardenShedNotes: string
  gardenFurniture: YesNo
  gardenFurnitureNotes: string
  assemblyRequired: YesNo
  assemblyNotes: string
}

export interface RemovalsQuotationRecord {
  id: string
  docType: string
  quotationType?: QuotationType
  status?: string
  quoteNumber?: string
  quoteDate?: string
  movingDate?: string
  customerName?: string
  phone?: string
  email?: string
  movingFrom?: Partial<MovingFromDetails>
  movingTo?: Partial<MovingToDetails>
  totalMovingPrice?: string
  packingRequired?: YesNo
  packingDay?: PackingDay
  packingDate?: string
  totalPackingCost?: string
  packingDescription?: string
  packingNotes?: string
  additionalNotes?: string
  createdAt?: Timestamp | null
}

interface NewDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docType: DocumentType
  category?: InvoiceCategory | null
  quotationType?: QuotationType | null
  onQuotationTypeChange?: (quotationType: QuotationType) => void
  editQuotation?: RemovalsQuotationRecord | null
}

const QUOTATION_TYPE_OPTIONS = (Object.entries(QUOTATION_TYPE_LABELS) as [QuotationType, string][]).map(
  ([value, label]) => ({ value, label })
)

const YES_NO_OPTIONS: { value: YesNo; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const PACKING_DAY_OPTIONS: { value: PackingDay; label: string }[] = [
  { value: 'same_day', label: 'Same day as move' },
  { value: 'different_date', label: 'Different date' },
]

const inputClass =
  'w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500'

function getTodayDate(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
          setOpen((p) => !p)
        }}
        className="w-full flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && rect && createPortal(
        <ul
          ref={listRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }}
          className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
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
        </ul>,
        document.body
      )}
    </div>
  )
}

function DatePicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const toDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }
  const toISO = (display: string) => {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
    if (!match) return ''
    const [, d, m, yy] = match
    const year = parseInt(yy, 10) >= 0 ? `20${yy}` : ''
    return `${year}-${m}-${d}`
  }

  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState(() => toDisplay(value))
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value).getFullYear() : new Date().getFullYear()))
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value).getMonth() : new Date().getMonth()))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTyped(toDisplay(value))
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleTyped = (raw: string) => {
    setTyped(raw)
    if (raw === '') {
      onChange('')
      return
    }
    const iso = toISO(raw)
    if (iso && !isNaN(new Date(`${iso}T00:00:00`).getTime())) {
      const d = new Date(`${iso}T00:00:00`)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      onChange(iso)
    }
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const todayStr = getTodayDate()

  const select = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(iso)
    setTyped(toDisplay(iso))
    setOpen(false)
  }
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500">
        <input
          type="text"
          value={typed}
          disabled={disabled}
          onChange={(e) => handleTyped(e.target.value)}
          placeholder="DD/MM/YY"
          className="flex-1 px-3 py-2 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none rounded-2xl disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((p) => !p)}
          className="pr-3 text-gray-400 hover:text-gray-200 disabled:opacity-50"
        >
          <CalendarDays className="w-4 h-4" />
        </button>
      </div>
      {open && !disabled && (
        <div className="absolute z-[60] mt-1 left-0 w-72 bg-black border border-white/10 rounded-3xl shadow-xl p-4">
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
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = dateStr === value
              const isToday = dateStr === todayStr
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(day)}
                  className={`w-8 h-8 mx-auto rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : isToday
                        ? 'ring-1 ring-white/20 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-xs text-gray-400 hover:text-white">
              Clear
            </button>
            <button type="button" onClick={() => { onChange(todayStr); setOpen(false) }} className="text-xs text-purple-400 hover:text-purple-300">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function YesNoField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: YesNo
  onChange: (value: YesNo) => void
  disabled?: boolean
}) {
  const groupName = useId()

  return (
    <fieldset disabled={disabled}>
      <legend className="block text-sm font-medium mb-2">{label}</legend>
      <div className="flex items-center gap-6 py-2">
        {YES_NO_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="w-4 h-4 accent-purple-600 disabled:cursor-not-allowed"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function FeatureRow({
  label,
  value,
  notes,
  notesLabel,
  onValueChange,
  onNotesChange,
  disabled,
}: {
  label: string
  value: YesNo
  notes: string
  notesLabel: string
  onValueChange: (value: YesNo) => void
  onNotesChange: (notes: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="md:col-span-4">
        <YesNoField label={label} value={value} onChange={onValueChange} disabled={disabled} />
      </div>
      <div className="md:col-span-8">
        <label className="block text-sm font-medium mb-1">{notesLabel}</label>
        <input
          type="text"
          value={notes}
          disabled={disabled}
          onChange={(e) => onNotesChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  )
}

const emptyMovingFrom = (): MovingFromDetails => ({
  address: '',
  bedrooms: '',
  garage: 'no',
  garageNotes: '',
  gardenShed: 'no',
  gardenShedNotes: '',
  gardenFurniture: 'no',
  gardenFurnitureNotes: '',
  dismantlingRequired: 'no',
  dismantlingNotes: '',
})

const emptyMovingTo = (): MovingToDetails => ({
  address: '',
  bedrooms: '',
  garage: 'no',
  garageNotes: '',
  gardenShed: 'no',
  gardenShedNotes: '',
  gardenFurniture: 'no',
  gardenFurnitureNotes: '',
  assemblyRequired: 'no',
  assemblyNotes: '',
})

async function generateNextQuoteNumber(excludeId?: string): Promise<string> {
  const snap = await getDocs(
    query(collection(db, 'documents'), where('docType', 'in', ['removals_quotation', 'clearance_quotation']))
  )
  const existing = new Set<string>()
  let maxNumber = 0

  snap.forEach((docSnap) => {
    if (excludeId && docSnap.id === excludeId) return
    const data = docSnap.data()
    const raw = String(data.quoteNumber ?? data.invoiceNumber ?? '').trim()
    if (!raw) return
    existing.add(raw.toUpperCase())
    const matches = raw.match(/\d+/g)
    if (matches?.length) {
      const parsed = parseInt(matches[matches.length - 1], 10)
      if (!isNaN(parsed) && parsed > maxNumber && parsed < 1000000) {
        maxNumber = parsed
      }
    }
  })

  for (let next = Math.max(1, maxNumber + 1); next <= 999999; next++) {
    const candidate = next.toString().padStart(3, '0')
    if (!existing.has(candidate)) return candidate
  }

  return `${Date.now()}`.slice(-6)
}

export default function NewDocumentModal({
  isOpen,
  onClose,
  docType,
  category,
  quotationType,
  onQuotationTypeChange,
  editQuotation,
}: NewDocumentModalProps) {
  const { user } = useAuth()

  const [quoteNumber, setQuoteNumber] = useState('')
  const [quoteNumberLoading, setQuoteNumberLoading] = useState(false)
  const [quoteDate, setQuoteDate] = useState(getTodayDate)
  const [movingDate, setMovingDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [movingFrom, setMovingFrom] = useState<MovingFromDetails>(emptyMovingFrom)
  const [movingTo, setMovingTo] = useState<MovingToDetails>(emptyMovingTo)
  const [totalMovingPrice, setTotalMovingPrice] = useState('')
  const [packingRequired, setPackingRequired] = useState<YesNo>('no')
  const [packingDay, setPackingDay] = useState<PackingDay>('same_day')
  const [packingDate, setPackingDate] = useState('')
  const [totalPackingCost, setTotalPackingCost] = useState('')
  const [packingDescription, setPackingDescription] = useState(DEFAULT_PACKING_DESCRIPTION)
  const [packingNotes, setPackingNotes] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [savingMode, setSavingMode] = useState<'draft' | 'issued' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeQuotationType = editQuotation ? 'removals' : quotationType
  const isRemovalsQuotation = docType === 'quotation' && activeQuotationType === 'removals'

  const resetRemovalsForm = () => {
    setQuoteNumber('')
    setQuoteDate(getTodayDate())
    setMovingDate('')
    setCustomerName('')
    setPhone('')
    setEmail('')
    setMovingFrom(emptyMovingFrom())
    setMovingTo(emptyMovingTo())
    setTotalMovingPrice('')
    setPackingRequired('no')
    setPackingDay('same_day')
    setPackingDate('')
    setTotalPackingCost('')
    setPackingDescription(DEFAULT_PACKING_DESCRIPTION)
    setPackingNotes('')
    setAdditionalNotes('')
    setSavingMode(null)
    setError(null)
  }

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setSavingMode(null)

    if (editQuotation) {
      setQuoteNumber(editQuotation.quoteNumber || '')
      setQuoteDate(editQuotation.quoteDate || getTodayDate())
      setMovingDate(editQuotation.movingDate || '')
      setCustomerName(editQuotation.customerName || '')
      setPhone(editQuotation.phone || '')
      setEmail(editQuotation.email || '')
      setMovingFrom({ ...emptyMovingFrom(), ...(editQuotation.movingFrom || {}) })
      setMovingTo({ ...emptyMovingTo(), ...(editQuotation.movingTo || {}) })
      setTotalMovingPrice(editQuotation.totalMovingPrice ?? '')
      setPackingRequired(editQuotation.packingRequired === 'yes' ? 'yes' : 'no')
      setPackingDay(editQuotation.packingDay === 'different_date' ? 'different_date' : 'same_day')
      setPackingDate(editQuotation.packingDate || '')
      setTotalPackingCost(editQuotation.totalPackingCost ?? '')
      setPackingDescription(editQuotation.packingDescription ?? DEFAULT_PACKING_DESCRIPTION)
      setPackingNotes(editQuotation.packingNotes || '')
      setAdditionalNotes(editQuotation.additionalNotes || '')
      if (!editQuotation.quoteNumber) {
        setQuoteNumberLoading(true)
        generateNextQuoteNumber(editQuotation.id)
          .then(setQuoteNumber)
          .catch(() => setError('Failed to generate quote number.'))
          .finally(() => setQuoteNumberLoading(false))
      }
      return
    }

    resetRemovalsForm()
  }, [isOpen, editQuotation])

  useEffect(() => {
    if (!isOpen || !isRemovalsQuotation || editQuotation || quoteNumber) return
    let active = true
    setQuoteNumberLoading(true)
    generateNextQuoteNumber()
      .then((next) => {
        if (active) setQuoteNumber(next)
      })
      .catch(() => {
        if (active) setError('Failed to generate quote number.')
      })
      .finally(() => {
        if (active) setQuoteNumberLoading(false)
      })
    return () => {
      active = false
    }
  }, [isOpen, isRemovalsQuotation, editQuotation, quoteNumber])

  if (!isOpen) return null

  const label = DOCUMENT_LABELS[docType]
  const selectedTypeLabel = docType === 'invoice' && category ? INVOICE_CATEGORY_LABELS[category] : null

  const isNonNegativeAmount = (raw: string) => {
    if (raw.trim() === '') return false
    const value = Number(raw)
    return Number.isFinite(value) && value >= 0
  }

  const validateRemovalsQuotation = (targetStatus: 'draft' | 'issued'): string | null => {
    if (!quoteNumber.trim()) return 'Quote Number is still being generated. Please wait a moment.'
    if (!quoteDate) return 'Quote Date is required.'
    if (!customerName.trim()) return 'Customer Name is required.'

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.'
    }

    if (movingFrom.bedrooms.trim() !== '') {
      const fromBeds = Number(movingFrom.bedrooms)
      if (!Number.isInteger(fromBeds) || fromBeds < 0) return 'Moving From number of bedrooms must be 0 or greater.'
    }

    if (movingTo.bedrooms.trim() !== '') {
      const toBeds = Number(movingTo.bedrooms)
      if (!Number.isInteger(toBeds) || toBeds < 0) return 'Moving To number of bedrooms must be 0 or greater.'
    }

    if (totalMovingPrice.trim() !== '' && !isNonNegativeAmount(totalMovingPrice)) {
      return 'Total Moving Price must be a non-negative amount.'
    }

    if (totalPackingCost.trim() !== '' && !isNonNegativeAmount(totalPackingCost)) {
      return 'Total Packing Cost must be a non-negative amount.'
    }

    if (packingRequired === 'yes' && packingDay === 'different_date' && targetStatus === 'issued' && !packingDate) {
      return 'Packing Date is required when Different date is selected.'
    }

    if (targetStatus === 'issued') {
      if (!movingDate) return 'Moving Date is required before issuing the quotation.'
      if (!phone.trim()) return 'Phone is required before issuing the quotation.'
      if (!email.trim()) return 'Email is required before issuing the quotation.'
      if (!movingFrom.address.trim()) return 'Moving From Address is required before issuing the quotation.'
      if (movingFrom.bedrooms.trim() === '') return 'Moving From Number of Bedrooms is required before issuing the quotation.'
      if (!movingTo.address.trim()) return 'Moving To Address is required before issuing the quotation.'
      if (movingTo.bedrooms.trim() === '') return 'Moving To Number of Bedrooms is required before issuing the quotation.'
      if (!isNonNegativeAmount(totalMovingPrice)) return 'Total Moving Price is required before issuing the quotation.'
      if (packingRequired === 'yes' && !isNonNegativeAmount(totalPackingCost)) {
        return 'Total Packing Cost is required when packing is selected.'
      }
    }

    return null
  }

  const saveRemovalsQuotation = async (targetStatus: 'draft' | 'issued') => {
    if (savingMode || quoteNumberLoading) return
    setError(null)

    const validationError = validateRemovalsQuotation(targetStatus)
    if (validationError) {
      setError(validationError)
      return
    }

    setSavingMode(targetStatus)
    try {
      const preservedQuoteNumber = quoteNumber.trim()
      const dupSnap = await getDocs(
        query(collection(db, 'documents'), where('quoteNumber', '==', preservedQuoteNumber))
      )
      const duplicateExists = dupSnap.docs.some((d) => d.id !== editQuotation?.id)
      if (duplicateExists) {
        setError(`Quote number "${preservedQuoteNumber}" is already in use. Enter a different quote number.`)
        setSavingMode(null)
        return
      }

      const movingPriceNum = parseFloat(totalMovingPrice || '0') || 0
      const packingCostNum = packingRequired === 'yes' ? (parseFloat(totalPackingCost || '0') || 0) : 0
      const combinedPrice = (movingPriceNum + packingCostNum).toFixed(2)

      const payload = {
        docType: 'removals_quotation',
        category: 'removal',
        quotationType: 'removals' as QuotationType,
        status: targetStatus,
        quoteNumber: preservedQuoteNumber,
        invoiceNumber: preservedQuoteNumber,
        quoteDate,
        movingDate,
        deliveryDate: movingDate,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: movingFrom.address.trim(),
        movingFrom: {
          address: movingFrom.address.trim(),
          bedrooms: movingFrom.bedrooms.trim(),
          garage: movingFrom.garage,
          garageNotes: movingFrom.garageNotes.trim(),
          gardenShed: movingFrom.gardenShed,
          gardenShedNotes: movingFrom.gardenShedNotes.trim(),
          gardenFurniture: movingFrom.gardenFurniture,
          gardenFurnitureNotes: movingFrom.gardenFurnitureNotes.trim(),
          dismantlingRequired: movingFrom.dismantlingRequired,
          dismantlingNotes: movingFrom.dismantlingNotes.trim(),
        },
        movingTo: {
          address: movingTo.address.trim(),
          bedrooms: movingTo.bedrooms.trim(),
          garage: movingTo.garage,
          garageNotes: movingTo.garageNotes.trim(),
          gardenShed: movingTo.gardenShed,
          gardenShedNotes: movingTo.gardenShedNotes.trim(),
          gardenFurniture: movingTo.gardenFurniture,
          gardenFurnitureNotes: movingTo.gardenFurnitureNotes.trim(),
          assemblyRequired: movingTo.assemblyRequired,
          assemblyNotes: movingTo.assemblyNotes.trim(),
        },
        totalMovingPrice: totalMovingPrice.trim(),
        packingRequired,
        packingDay: packingRequired === 'yes' ? packingDay : 'same_day',
        packingDate: packingRequired === 'yes' && packingDay === 'different_date' ? packingDate : '',
        totalPackingCost: packingRequired === 'yes' ? totalPackingCost.trim() : '0',
        packingDescription: packingDescription.trim() || DEFAULT_PACKING_DESCRIPTION,
        packingNotes: packingNotes.trim(),
        additionalNotes: additionalNotes.trim(),
        companyDetails: REMOVALS_QUOTATION_COMPANY_DETAILS,
        itemName: 'Removals',
        price: totalMovingPrice.trim() || packingCostNum > 0 ? combinedPrice : '',
      }

      if (editQuotation) {
        await updateDoc(doc(db, 'documents', editQuotation.id), {
          ...payload,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
          ...(targetStatus === 'issued'
            ? {
                issuedAt: serverTimestamp(),
                issuedBy: user?.uid ?? null,
              }
            : {}),
        })
      } else {
        await addDoc(collection(db, 'documents'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.uid ?? null,
          createdByName: user?.displayName ?? user?.email ?? null,
          ...(targetStatus === 'issued'
            ? {
                issuedAt: serverTimestamp(),
                issuedBy: user?.uid ?? null,
              }
            : {}),
        })
      }

      onClose()
    } catch {
      setError('Failed to save the quotation. Please try again.')
      setSavingMode(null)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isRemovalsQuotation) {
      saveRemovalsQuotation('issued')
    }
  }

  if (isRemovalsQuotation) {
    const isBusy = savingMode !== null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget && !isBusy) onClose() }}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        <div className="modal-scroll relative w-full max-w-4xl max-h-[85vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Documents</p>
              <h2 className="text-2xl font-semibold">{editQuotation ? 'Edit Removals Quotation' : 'New Removals Quotation'}</h2>
            </div>
            <button
              type="button"
              disabled={isBusy}
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!editQuotation && activeQuotationType && (
              <div>
                <label className="block text-sm font-medium mb-1">Quotation Type</label>
                <CustomSelect
                  value={activeQuotationType}
                  onChange={(value) => onQuotationTypeChange?.(value)}
                  options={QUOTATION_TYPE_OPTIONS}
                  disabled={isBusy}
                />
              </div>
            )}

            {/* 1. Customer and quotation details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Customer &amp; Quotation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="quoteNumber" className="block text-sm font-medium mb-1">
                    Quote Number
                  </label>
                  <input
                    id="quoteNumber"
                    name="quoteNumber"
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    disabled={isBusy || quoteNumberLoading}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quote Date</label>
                  <DatePicker value={quoteDate} onChange={setQuoteDate} disabled={isBusy} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Moving Date</label>
                  <DatePicker value={movingDate} onChange={setMovingDate} disabled={isBusy} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium mb-1">
                    Customer Name
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    value={customerName}
                    disabled={isBusy}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    disabled={isBusy}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    disabled={isBusy}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* 2. Moving From */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Moving From
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="movingFromAddress" className="block text-sm font-medium mb-1">
                    Moving From Address
                  </label>
                  <textarea
                    id="movingFromAddress"
                    rows={3}
                    value={movingFrom.address}
                    disabled={isBusy}
                    onChange={(e) => setMovingFrom((p) => ({ ...p, address: e.target.value }))}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label htmlFor="movingFromBedrooms" className="block text-sm font-medium mb-1">
                    Number of Bedrooms
                  </label>
                  <input
                    id="movingFromBedrooms"
                    type="number"
                    min="0"
                    step="1"
                    value={movingFrom.bedrooms}
                    disabled={isBusy}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setMovingFrom((p) => ({ ...p, bedrooms: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <FeatureRow
                  label="Garage"
                  value={movingFrom.garage}
                  notes={movingFrom.garageNotes}
                  notesLabel="Garage Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, garage: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, garageNotes: notes }))}
                />
                <FeatureRow
                  label="Garden Shed"
                  value={movingFrom.gardenShed}
                  notes={movingFrom.gardenShedNotes}
                  notesLabel="Garden Shed Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, gardenShed: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, gardenShedNotes: notes }))}
                />
                <FeatureRow
                  label="Garden Furniture"
                  value={movingFrom.gardenFurniture}
                  notes={movingFrom.gardenFurnitureNotes}
                  notesLabel="Garden Furniture Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, gardenFurniture: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, gardenFurnitureNotes: notes }))}
                />
                <FeatureRow
                  label="Dismantling Required"
                  value={movingFrom.dismantlingRequired}
                  notes={movingFrom.dismantlingNotes}
                  notesLabel="Dismantling Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, dismantlingRequired: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, dismantlingNotes: notes }))}
                />
              </div>
            </div>

            {/* 3. Moving To */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Moving To
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="movingToAddress" className="block text-sm font-medium mb-1">
                    Moving To Address
                  </label>
                  <textarea
                    id="movingToAddress"
                    rows={3}
                    value={movingTo.address}
                    disabled={isBusy}
                    onChange={(e) => setMovingTo((p) => ({ ...p, address: e.target.value }))}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label htmlFor="movingToBedrooms" className="block text-sm font-medium mb-1">
                    Number of Bedrooms
                  </label>
                  <input
                    id="movingToBedrooms"
                    type="number"
                    min="0"
                    step="1"
                    value={movingTo.bedrooms}
                    disabled={isBusy}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setMovingTo((p) => ({ ...p, bedrooms: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <FeatureRow
                  label="Garage"
                  value={movingTo.garage}
                  notes={movingTo.garageNotes}
                  notesLabel="Garage Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, garage: v }))}
                  onNotesChange={(notes) => setMovingTo((p) => ({ ...p, garageNotes: notes }))}
                />
                <FeatureRow
                  label="Garden Shed"
                  value={movingTo.gardenShed}
                  notes={movingTo.gardenShedNotes}
                  notesLabel="Garden Shed Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, gardenShed: v }))}
                  onNotesChange={(notes) => setMovingTo((p) => ({ ...p, gardenShedNotes: notes }))}
                />
                <FeatureRow
                  label="Garden Furniture"
                  value={movingTo.gardenFurniture}
                  notes={movingTo.gardenFurnitureNotes}
                  notesLabel="Garden Furniture Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, gardenFurniture: v }))}
                  onNotesChange={(notes) => setMovingTo((p) => ({ ...p, gardenFurnitureNotes: notes }))}
                />
                <FeatureRow
                  label="Assembly Required"
                  value={movingTo.assemblyRequired}
                  notes={movingTo.assemblyNotes}
                  notesLabel="Assembly Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, assemblyRequired: v }))}
                  onNotesChange={(notes) => setMovingTo((p) => ({ ...p, assemblyNotes: notes }))}
                />
              </div>
            </div>

            {/* 4. Moving and packing costs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Moving &amp; Packing Costs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="totalMovingPrice" className="block text-sm font-medium mb-1">
                    Total Moving Price (£)
                  </label>
                  <input
                    id="totalMovingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalMovingPrice}
                    disabled={isBusy}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setTotalMovingPrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <YesNoField
                  label="Packing Required"
                  value={packingRequired}
                  onChange={setPackingRequired}
                  disabled={isBusy}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Packing Day</label>
                  <CustomSelect
                    value={packingDay}
                    onChange={setPackingDay}
                    options={PACKING_DAY_OPTIONS}
                    disabled={isBusy}
                  />
                </div>
                {packingDay === 'different_date' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Packing Date</label>
                    <DatePicker value={packingDate} onChange={setPackingDate} disabled={isBusy} />
                  </div>
                )}
                <div>
                  <label htmlFor="totalPackingCost" className="block text-sm font-medium mb-1">
                    Total Packing Cost (£)
                  </label>
                  <input
                    id="totalPackingCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalPackingCost}
                    disabled={isBusy}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setTotalPackingCost(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="packingDescription" className="block text-sm font-medium mb-1">
                  Packing Description
                </label>
                <textarea
                  id="packingDescription"
                  rows={2}
                  value={packingDescription}
                  disabled={isBusy}
                  onChange={(e) => setPackingDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label htmlFor="packingNotes" className="block text-sm font-medium mb-1">
                  Packing Notes
                </label>
                <textarea
                  id="packingNotes"
                  rows={3}
                  value={packingNotes}
                  disabled={isBusy}
                  onChange={(e) => setPackingNotes(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* 5. Additional information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Additional Information
              </h3>
              <div>
                <label htmlFor="additionalNotes" className="block text-sm font-medium mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="additionalNotes"
                  rows={3}
                  value={additionalNotes}
                  disabled={isBusy}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* 6. Fixed company details */}


            {error && (
              <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-2xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isBusy}
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy || quoteNumberLoading}
                onClick={() => saveRemovalsQuotation('draft')}
                className="px-4 py-2 rounded-2xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingMode === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Draft
              </button>
              <button
                type="submit"
                disabled={isBusy || quoteNumberLoading}
                className="px-4 py-2 rounded-2xl text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingMode === 'issued' && <Loader2 className="w-4 h-4 animate-spin" />}
                Issue Quotation
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="modal-scroll relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">New {label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {docType === 'quotation' && quotationType ? (
            <div>
              <label className="block text-sm font-medium mb-1">
                Quotation Type
              </label>
              <CustomSelect
                value={quotationType}
                onChange={(value) => onQuotationTypeChange?.(value)}
                options={QUOTATION_TYPE_OPTIONS}
              />
            </div>
          ) : selectedTypeLabel && (
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <div className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300">
                {selectedTypeLabel}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium mb-1">
              Customer Name
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="documentDate" className="block text-sm font-medium mb-1">
              {label} Date
            </label>
            <input
              id="documentDate"
              name="documentDate"
              type="date"
              style={{ colorScheme: 'dark' }}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <p className="text-xs text-gray-500">Saving documents will be enabled in a future update.</p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled
              className="px-4 py-2 rounded-2xl text-sm bg-purple-600 text-white opacity-50 cursor-not-allowed"
            >
              Create {label}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
