import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react'
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
export type PropertyType = 'house' | 'flat'

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
  phone: '07777 249530 / 07946 775933',
  website: 'www.weoneremovals.com',
  email: 'enquiry@weoneremovals.com',
  contactEmail: 'chris@weoneremovals.com',
  thankYou: 'We are a fully insured, East Anglian-based removal company providing reliable local and national moving services.\nWe appreciate the opportunity to quote for your move and look forward to helping make it smooth and straightforward.',
} as const

export interface CustomNote {
  title: string
  note: string
}

export interface MovingFromDetails {
  address: string
  postcode?: string
  bedrooms: string
  propertyType?: PropertyType
  storeys: string
  floor: string
  lift: YesNo
  upstairsBedroomNotes: string[]
  downstairsBedroomNotes: string[]
  upstairsBathroomNotes: string[]
  downstairsBathroomNotes: string[]
  garage: YesNo
  garageNotes: string
  gardenShed: YesNo
  gardenShedNotes: string
  gardenFurniture: YesNo
  gardenFurnitureNotes: string
  dismantlingRequired: YesNo
  dismantlingNotes: string
  upstairsHallway: YesNo
  upstairsHallwayNotes: string
  downstairsHallway: YesNo
  downstairsHallwayNotes: string
  kitchen: YesNo
  kitchenNotes: string
  utilityRoom: YesNo
  utilityRoomNotes: string
  conservatory: YesNo
  conservatoryNotes: string
  customNotes: CustomNote[]
}

export interface MovingToDetails {
  address: string
  postcode?: string
  bedrooms: string
  propertyType?: PropertyType
  storeys: string
  floor: string
  lift: YesNo
  garage: YesNo
  garageNotes: string
  gardenShed: YesNo
  gardenShedNotes: string
  gardenFurniture: YesNo
  gardenFurnitureNotes: string
  assemblyRequired: YesNo
  assemblyNotes: string
  customNotes: CustomNote[]
}

export const DEFAULT_INCLUDED_SERVICES = {
  safeTransportation: true,
  loadingUnloading: true,
  equippedVans: true,
  professionalCrew: true,
  removalBlankets: true,
  protectiveCovers: true,
  shrinkWrapping: true,
  floorProtection: true,
}

export const INCLUDED_SERVICE_DETAILS = {
  safeTransportation: { label: 'Safe Transportation', description: 'Safe and secure transportation to your new property.' },
  loadingUnloading: { label: 'Loading & Unloading', description: 'Professional loading and unloading.' },
  equippedVans: { label: 'Equipped Vans', description: 'Fully equipped vans with all necessary tools.' },
  professionalCrew: { label: 'Professional Crew', description: 'Professional, uniformed and DBS-checked crew members.' },
  removalBlankets: { label: 'Removal Blankets', description: 'Protective removal blankets for all furniture during transportation.' },
  protectiveCovers: { label: 'Protective Covers', description: 'Protective mattress and sofa covers.' },
  shrinkWrapping: { label: 'Shrink Wrapping', description: 'Shrink wrapping of solid furniture and large appliances.' },
  floorProtection: { label: 'Floor Protection', description: 'Protective floor wrapping to prevent scratches, scuffs and damage during the move.' },
} as const

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
  numberOfVans?: string
  crewMembers?: string
  totalMovingPrice?: string
  packingRequired?: YesNo
  packingDay?: PackingDay
  packingDate?: string
  totalPackingCost?: string
  packingDescription?: string
  packingNotes?: string
  additionalNotes?: string
  includedServices?: Partial<typeof DEFAULT_INCLUDED_SERVICES>
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

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'flat', label: 'Flat' },
]

const REMOVAL_STEPS = ['Details', 'Moving From', 'Moving To', 'Services & Costs', 'Review'] as const

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

function RadioField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T | undefined
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  disabled?: boolean
}) {
  const groupName = useId()

  return (
    <fieldset disabled={disabled}>
      <legend className="block text-sm font-medium mb-2">{label}</legend>
      <div className="flex items-center gap-6 py-2">
        {options.map((opt) => (
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
  return <RadioField label={label} value={value} options={YES_NO_OPTIONS} onChange={onChange} disabled={disabled} />
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
  notes?: string
  notesLabel?: string
  onValueChange: (value: YesNo) => void
  onNotesChange?: (notes: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className={notesLabel === undefined ? 'md:col-span-12' : 'md:col-span-4'}>
        <YesNoField label={label} value={value} onChange={onValueChange} disabled={disabled} />
      </div>
      {notesLabel !== undefined && (
        <div className="md:col-span-8">
          <label className="block text-sm font-medium mb-1">{notesLabel}</label>
          <textarea
            rows={3}
            value={notes}
            disabled={disabled}
            onChange={(e) => onNotesChange?.(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>
      )}
    </div>
  )
}

function NotesEditor({
  title,
  addLabel,
  notes,
  onChange,
  disabled,
}: {
  title: string
  addLabel: string
  notes: string[]
  onChange: (notes: string[]) => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
      <span className="block text-sm font-medium">{title}</span>
      {notes.length === 0 && (
        <p className="text-xs text-gray-500">No {title.toLowerCase()} notes added yet.</p>
      )}
      {notes.map((note, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {notes.length > 1 && (
            <label className="md:col-span-4 block text-sm font-medium">
              Bedroom {index + 1} Notes
            </label>
          )}
          <div className={`${notes.length > 1 ? 'md:col-span-8' : 'md:col-span-12'} flex items-center gap-2`}>
            <textarea
              rows={3}
              value={note}
              disabled={disabled}
              onChange={(e) => onChange(notes.map((n, i) => (i === index ? e.target.value : n)))}
              className={`${inputClass} resize-none`}
            />
            {notes.length > 1 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(notes.filter((_, i) => i !== index))}
                aria-label={`Remove ${title.toLowerCase()} ${index + 1} notes`}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...notes, ''])}
        className="px-3 py-1.5 rounded-2xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  )
}

function CustomNotesEditor({
  notes,
  onChange,
  disabled,
}: {
  notes: CustomNote[]
  onChange: (notes: CustomNote[]) => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
      <span className="block text-sm font-medium">Custom Notes</span>
      {notes.length === 0 && (
        <p className="text-xs text-gray-500">No custom notes added yet.</p>
      )}
      {notes.map((item, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <input
            type="text"
            value={item.title}
            placeholder="Title"
            disabled={disabled}
            onChange={(e) => onChange(notes.map((n, i) => (i === index ? { ...n, title: e.target.value } : n)))}
            className={`${inputClass} md:col-span-4`}
          />
          <div className="md:col-span-8 flex items-start gap-2">
            <textarea
              rows={3}
              value={item.note}
              placeholder="Notes"
              disabled={disabled}
              onChange={(e) => onChange(notes.map((n, i) => (i === index ? { ...n, note: e.target.value } : n)))}
              className={`${inputClass} resize-none`}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(notes.filter((_, i) => i !== index))}
              aria-label={`Remove custom note ${index + 1}`}
              className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...notes, { title: '', note: '' }])}
        className="px-3 py-1.5 rounded-2xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Add note
      </button>
    </div>
  )
}

const emptyMovingFrom = (): MovingFromDetails => ({
  address: '',
  postcode: '',
  bedrooms: '',
  storeys: '',
  floor: '',
  lift: 'no',
  upstairsBedroomNotes: [''],
  downstairsBedroomNotes: [''],
  upstairsBathroomNotes: [''],
  downstairsBathroomNotes: [''],
  garage: 'no',
  garageNotes: '',
  gardenShed: 'no',
  gardenShedNotes: '',
  gardenFurniture: 'no',
  gardenFurnitureNotes: '',
  dismantlingRequired: 'no',
  dismantlingNotes: '',
  upstairsHallway: 'no',
  upstairsHallwayNotes: '',
  downstairsHallway: 'no',
  downstairsHallwayNotes: '',
  kitchen: 'no',
  kitchenNotes: '',
  utilityRoom: 'no',
  utilityRoomNotes: '',
  conservatory: 'no',
  conservatoryNotes: '',
  customNotes: [],
})

const emptyMovingTo = (): MovingToDetails => ({
  address: '',
  postcode: '',
  bedrooms: '',
  storeys: '',
  floor: '',
  lift: 'no',
  garage: 'no',
  garageNotes: '',
  gardenShed: 'no',
  gardenShedNotes: '',
  gardenFurniture: 'no',
  gardenFurnitureNotes: '',
  assemblyRequired: 'no',
  assemblyNotes: '',
  customNotes: [],
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
    const candidate = `REM-QUO-${next.toString().padStart(3, '0')}`
    if (!existing.has(candidate)) return candidate
  }

  throw new Error('Quotation number sequence is exhausted.')
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
  const [numberOfVans, setNumberOfVans] = useState('')
  const [crewMembers, setCrewMembers] = useState('')
  const [totalMovingPrice, setTotalMovingPrice] = useState('')
  const [packingRequired, setPackingRequired] = useState<YesNo>('no')
  const [packingDay, setPackingDay] = useState<PackingDay>('same_day')
  const [packingDate, setPackingDate] = useState('')
  const [totalPackingCost, setTotalPackingCost] = useState('')
  const [packingDescription, setPackingDescription] = useState(DEFAULT_PACKING_DESCRIPTION)
  const [packingNotes, setPackingNotes] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [includedServices, setIncludedServices] = useState({ ...DEFAULT_INCLUDED_SERVICES })
  const [savingMode, setSavingMode] = useState<'draft' | 'issued' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)

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
    setNumberOfVans('')
    setCrewMembers('')
    setTotalMovingPrice('')
    setPackingRequired('no')
    setPackingDay('same_day')
    setPackingDate('')
    setTotalPackingCost('')
    setPackingDescription(DEFAULT_PACKING_DESCRIPTION)
    setPackingNotes('')
    setAdditionalNotes('')
    setIncludedServices({ ...DEFAULT_INCLUDED_SERVICES })
    setSavingMode(null)
    setError(null)
    setStep(0)
  }

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setSavingMode(null)
    setStep(0)

    if (editQuotation) {
      setQuoteNumber(editQuotation.quoteNumber || '')
      setQuoteDate(editQuotation.quoteDate || getTodayDate())
      setMovingDate(editQuotation.movingDate || '')
      setCustomerName(editQuotation.customerName || '')
      setPhone(editQuotation.phone || '')
      setEmail(editQuotation.email || '')
      const loadedMovingFrom = { ...emptyMovingFrom(), ...(editQuotation.movingFrom || {}) }
      if (!loadedMovingFrom.upstairsBedroomNotes?.length) loadedMovingFrom.upstairsBedroomNotes = ['']
      if (!loadedMovingFrom.downstairsBedroomNotes?.length) loadedMovingFrom.downstairsBedroomNotes = ['']
      if (!loadedMovingFrom.upstairsBathroomNotes?.length) loadedMovingFrom.upstairsBathroomNotes = ['']
      if (!loadedMovingFrom.downstairsBathroomNotes?.length) loadedMovingFrom.downstairsBathroomNotes = ['']
      setMovingFrom(loadedMovingFrom)
      setMovingTo({ ...emptyMovingTo(), ...(editQuotation.movingTo || {}) })
      setNumberOfVans(editQuotation.numberOfVans ?? '')
      setCrewMembers(editQuotation.crewMembers ?? '')
      setTotalMovingPrice(editQuotation.totalMovingPrice ?? '')
      setPackingRequired(editQuotation.packingRequired === 'yes' ? 'yes' : 'no')
      setPackingDay(editQuotation.packingDay === 'different_date' ? 'different_date' : 'same_day')
      setPackingDate(editQuotation.packingDate || '')
      setTotalPackingCost(editQuotation.totalPackingCost ?? '')
      setPackingDescription(editQuotation.packingDescription ?? DEFAULT_PACKING_DESCRIPTION)
      setPackingNotes(editQuotation.packingNotes || '')
      setAdditionalNotes(editQuotation.additionalNotes || '')
      setIncludedServices({ ...DEFAULT_INCLUDED_SERVICES, ...editQuotation.includedServices })
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
      if (!movingFrom.address.trim()) return 'Moving From is required before issuing the quotation.'
      if (movingFrom.bedrooms.trim() === '') return 'Moving From Number of Bedrooms is required before issuing the quotation.'
      if (!movingTo.address.trim()) return 'Moving To is required before issuing the quotation.'
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
        setQuoteNumber(await generateNextQuoteNumber(editQuotation?.id))
        setError(`Quote number "${preservedQuoteNumber}" is already in use. A new number has been generated. Please save again.`)
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
          postcode: movingFrom.postcode?.trim() || '',
          bedrooms: movingFrom.bedrooms.trim(),
          propertyType: movingFrom.propertyType || '',
          storeys: movingFrom.propertyType === 'house' ? movingFrom.storeys.trim() : '',
          floor: movingFrom.propertyType === 'flat' ? movingFrom.floor.trim() : '',
          lift: movingFrom.propertyType === 'flat' ? movingFrom.lift : 'no',
          upstairsBedroomNotes: movingFrom.upstairsBedroomNotes.map((note) => note.trim()).filter(Boolean),
          downstairsBedroomNotes: movingFrom.downstairsBedroomNotes.map((note) => note.trim()).filter(Boolean),
          upstairsBathroomNotes: movingFrom.upstairsBathroomNotes.map((note) => note.trim()).filter(Boolean),
          downstairsBathroomNotes: movingFrom.downstairsBathroomNotes.map((note) => note.trim()).filter(Boolean),
          garage: movingFrom.garage,
          garageNotes: movingFrom.garageNotes.trim(),
          gardenShed: movingFrom.gardenShed,
          gardenShedNotes: movingFrom.gardenShedNotes.trim(),
          gardenFurniture: movingFrom.gardenFurniture,
          gardenFurnitureNotes: movingFrom.gardenFurnitureNotes.trim(),
          dismantlingRequired: movingFrom.dismantlingRequired,
          dismantlingNotes: movingFrom.dismantlingNotes.trim(),
          upstairsHallway: movingFrom.upstairsHallway,
          upstairsHallwayNotes: movingFrom.upstairsHallwayNotes.trim(),
          downstairsHallway: movingFrom.downstairsHallway,
          downstairsHallwayNotes: movingFrom.downstairsHallwayNotes.trim(),
          kitchen: movingFrom.kitchen,
          kitchenNotes: movingFrom.kitchenNotes.trim(),
          utilityRoom: movingFrom.utilityRoom,
          utilityRoomNotes: movingFrom.utilityRoomNotes.trim(),
          conservatory: movingFrom.conservatory,
          conservatoryNotes: movingFrom.conservatoryNotes.trim(),
          customNotes: movingFrom.customNotes
            .map((item) => ({ title: item.title.trim(), note: item.note.trim() }))
            .filter((item) => item.title || item.note),
        },
        movingTo: {
          address: movingTo.address.trim(),
          postcode: movingTo.postcode?.trim() || '',
          bedrooms: movingTo.bedrooms.trim(),
          propertyType: movingTo.propertyType || '',
          storeys: movingTo.propertyType === 'house' ? movingTo.storeys.trim() : '',
          floor: movingTo.propertyType === 'flat' ? movingTo.floor.trim() : '',
          lift: movingTo.propertyType === 'flat' ? movingTo.lift : 'no',
          garage: movingTo.garage,
          garageNotes: movingTo.garageNotes.trim(),
          gardenShed: movingTo.gardenShed,
          gardenShedNotes: movingTo.gardenShedNotes.trim(),
          gardenFurniture: movingTo.gardenFurniture,
          gardenFurnitureNotes: movingTo.gardenFurnitureNotes.trim(),
          assemblyRequired: movingTo.assemblyRequired,
          assemblyNotes: movingTo.assemblyNotes.trim(),
          customNotes: movingTo.customNotes
            .map((item) => ({ title: item.title.trim(), note: item.note.trim() }))
            .filter((item) => item.title || item.note),
        },
        numberOfVans: numberOfVans.trim(),
        crewMembers: crewMembers.trim(),
        totalMovingPrice: totalMovingPrice.trim(),
        packingRequired,
        packingDay: packingRequired === 'yes' ? packingDay : 'same_day',
        packingDate: packingRequired === 'yes' && packingDay === 'different_date' ? packingDate : '',
        totalPackingCost: packingRequired === 'yes' ? totalPackingCost.trim() : '0',
        packingDescription: packingDescription.trim() || DEFAULT_PACKING_DESCRIPTION,
        packingNotes: packingNotes.trim(),
        additionalNotes: additionalNotes.trim(),
        includedServices,
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {REMOVAL_STEPS.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(index)}
                    aria-label={label}
                    className={`h-3 rounded-full transition-all ${index === step ? 'w-8 bg-purple-500' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-400">
                Step {step + 1} of {REMOVAL_STEPS.length}
              </span>
            </div>

            {(step === 0 || step === 4) && !editQuotation && activeQuotationType && (
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
            {(step === 0 || step === 4) && (
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
                    readOnly
                    aria-readonly="true"
                    disabled={isBusy || quoteNumberLoading}
                    className={`${inputClass} cursor-default text-gray-400`}
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
            )}

            {/* 2. Moving From */}
            {(step === 1 || step === 4) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="numberOfVans" className="block text-sm font-medium mb-1">
                    Number of Vans
                  </label>
                  <input
                    id="numberOfVans"
                    type="number"
                    min="0"
                    step="1"
                    value={numberOfVans}
                    disabled={isBusy}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setNumberOfVans(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="crewMembers" className="block text-sm font-medium mb-1">
                    Number of Crew Members
                  </label>
                  <input
                    id="crewMembers"
                    type="number"
                    min="0"
                    step="1"
                    value={crewMembers}
                    disabled={isBusy}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setCrewMembers(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Moving From
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="movingFromAddress" className="block text-sm font-medium mb-1">
                    Moving From
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RadioField
                  label="Property Type"
                  value={movingFrom.propertyType}
                  options={PROPERTY_TYPE_OPTIONS}
                  disabled={isBusy}
                  onChange={(v) => setMovingFrom((p) => ({ ...p, propertyType: v }))}
                />
                {movingFrom.propertyType === 'house' && (
                  <div>
                    <label htmlFor="movingFromStoreys" className="block text-sm font-medium mb-1">
                      Number of Storeys
                    </label>
                    <input
                      id="movingFromStoreys"
                      type="number"
                      min="0"
                      step="1"
                      value={movingFrom.storeys}
                      disabled={isBusy}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setMovingFrom((p) => ({ ...p, storeys: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                )}
                {movingFrom.propertyType === 'flat' && (
                  <>
                    <div>
                      <label htmlFor="movingFromFloor" className="block text-sm font-medium mb-1">
                        Which Floor
                      </label>
                      <input
                        id="movingFromFloor"
                        type="number"
                        min="0"
                        step="1"
                        value={movingFrom.floor}
                        disabled={isBusy}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => setMovingFrom((p) => ({ ...p, floor: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <YesNoField
                      label="Lift"
                      value={movingFrom.lift}
                      disabled={isBusy}
                      onChange={(v) => setMovingFrom((p) => ({ ...p, lift: v }))}
                    />
                  </>
                )}
              </div>

              <NotesEditor
                title="Upstairs Bedroom"
                addLabel="Add bedroom"
                notes={movingFrom.upstairsBedroomNotes}
                disabled={isBusy}
                onChange={(notes) => setMovingFrom((p) => ({ ...p, upstairsBedroomNotes: notes }))}
              />

              <NotesEditor
                title="Downstairs Bedroom"
                addLabel="Add bedroom"
                notes={movingFrom.downstairsBedroomNotes}
                disabled={isBusy}
                onChange={(notes) => setMovingFrom((p) => ({ ...p, downstairsBedroomNotes: notes }))}
              />

              <NotesEditor
                title="Upstairs Bathroom"
                addLabel="Add bathroom"
                notes={movingFrom.upstairsBathroomNotes}
                disabled={isBusy}
                onChange={(notes) => setMovingFrom((p) => ({ ...p, upstairsBathroomNotes: notes }))}
              />

              <NotesEditor
                title="Downstairs Bathroom"
                addLabel="Add bathroom"
                notes={movingFrom.downstairsBathroomNotes}
                disabled={isBusy}
                onChange={(notes) => setMovingFrom((p) => ({ ...p, downstairsBathroomNotes: notes }))}
              />

              <div className="space-y-3">
                <FeatureRow
                  label="Kitchen"
                  value={movingFrom.kitchen}
                  notes={movingFrom.kitchenNotes}
                  notesLabel="Kitchen Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, kitchen: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, kitchenNotes: notes }))}
                />
                <FeatureRow
                  label="Utility Room"
                  value={movingFrom.utilityRoom}
                  notes={movingFrom.utilityRoomNotes}
                  notesLabel="Utility Room Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, utilityRoom: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, utilityRoomNotes: notes }))}
                />
                <FeatureRow
                  label="Conservatory"
                  value={movingFrom.conservatory}
                  notes={movingFrom.conservatoryNotes}
                  notesLabel="Conservatory Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, conservatory: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, conservatoryNotes: notes }))}
                />
                <FeatureRow
                  label="Downstairs Hallway"
                  value={movingFrom.downstairsHallway}
                  notes={movingFrom.downstairsHallwayNotes}
                  notesLabel="Downstairs Hallway Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, downstairsHallway: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, downstairsHallwayNotes: notes }))}
                />
                <FeatureRow
                  label="Upstairs Hallway"
                  value={movingFrom.upstairsHallway}
                  notes={movingFrom.upstairsHallwayNotes}
                  notesLabel="Upstairs Hallway Notes"
                  disabled={isBusy}
                  onValueChange={(v) => setMovingFrom((p) => ({ ...p, upstairsHallway: v }))}
                  onNotesChange={(notes) => setMovingFrom((p) => ({ ...p, upstairsHallwayNotes: notes }))}
                />
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

              <CustomNotesEditor
                notes={movingFrom.customNotes}
                disabled={isBusy}
                onChange={(notes) => setMovingFrom((p) => ({ ...p, customNotes: notes }))}
              />
            </div>
            )}

            {/* 3. Moving To */}
            {(step === 2 || step === 4) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Moving To
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="movingToAddress" className="block text-sm font-medium mb-1">
                    Moving To
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RadioField
                  label="Property Type"
                  value={movingTo.propertyType}
                  options={PROPERTY_TYPE_OPTIONS}
                  disabled={isBusy}
                  onChange={(v) => setMovingTo((p) => ({ ...p, propertyType: v }))}
                />
                {movingTo.propertyType === 'house' && (
                  <div>
                    <label htmlFor="movingToStoreys" className="block text-sm font-medium mb-1">
                      Number of Storeys
                    </label>
                    <input
                      id="movingToStoreys"
                      type="number"
                      min="0"
                      step="1"
                      value={movingTo.storeys}
                      disabled={isBusy}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setMovingTo((p) => ({ ...p, storeys: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                )}
                {movingTo.propertyType === 'flat' && (
                  <>
                    <div>
                      <label htmlFor="movingToFloor" className="block text-sm font-medium mb-1">
                        Which Floor
                      </label>
                      <input
                        id="movingToFloor"
                        type="number"
                        min="0"
                        step="1"
                        value={movingTo.floor}
                        disabled={isBusy}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => setMovingTo((p) => ({ ...p, floor: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <YesNoField
                      label="Lift"
                      value={movingTo.lift}
                      disabled={isBusy}
                      onChange={(v) => setMovingTo((p) => ({ ...p, lift: v }))}
                    />
                  </>
                )}
              </div>

              <div className="space-y-3">
                <FeatureRow
                  label="Garage"
                  value={movingTo.garage}
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, garage: v }))}
                />
                <FeatureRow
                  label="Garden Shed"
                  value={movingTo.gardenShed}
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, gardenShed: v }))}
                />
                <FeatureRow
                  label="Assembly Required"
                  value={movingTo.assemblyRequired}
                  disabled={isBusy}
                  onValueChange={(v) => setMovingTo((p) => ({ ...p, assemblyRequired: v }))}
                />
              </div>

              <CustomNotesEditor
                notes={movingTo.customNotes}
                disabled={isBusy}
                onChange={(notes) => setMovingTo((p) => ({ ...p, customNotes: notes }))}
              />
            </div>
            )}

            {(step === 3 || step === 4) && (
            <>
            <fieldset disabled={isBusy} className="space-y-4">
              <legend className="text-lg font-semibold text-white border-b border-white/10 pb-2 w-full">What's Included</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(INCLUDED_SERVICE_DETAILS) as (keyof typeof INCLUDED_SERVICE_DETAILS)[]).map((key) => (
                  <label key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={includedServices[key]} onChange={(e) => setIncludedServices((current) => ({ ...current, [key]: e.target.checked }))} className="mt-1 accent-purple-600" />
                    <span><span className="block font-medium">{INCLUDED_SERVICE_DETAILS[key].label}</span><span className="block text-xs text-gray-400 mt-1">{INCLUDED_SERVICE_DETAILS[key].description}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

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

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between gap-4">
              <span className="font-semibold text-white">Total Quote Amount</span>
              <output className="text-xl font-semibold text-white">
                {isNonNegativeAmount(totalMovingPrice) && (packingRequired !== 'yes' || isNonNegativeAmount(totalPackingCost))
                  ? (Number(totalMovingPrice) + (packingRequired === 'yes' ? Number(totalPackingCost) : 0)).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
                  : '—'}
              </output>
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
            </>
            )}

            {/* 6. Fixed company details */}


            {error && (
              <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-2xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isBusy || quoteNumberLoading}
                onClick={() => saveRemovalsQuotation('draft')}
                className="px-4 py-2 rounded-2xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingMode === 'draft' && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Draft
              </button>
              {step < REMOVAL_STEPS.length - 1 && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStep(REMOVAL_STEPS.length - 1)}
                  className="px-4 py-2 rounded-2xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
              )}
              {step > 0 && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-2xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              )}
              {step < REMOVAL_STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 rounded-2xl text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isBusy || quoteNumberLoading}
                  className="px-4 py-2 rounded-2xl text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingMode === 'issued' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Issue Quotation
                </button>
              )}
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
