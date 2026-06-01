import { X, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Upload, Paperclip, Trash2, Loader2 } from 'lucide-react'
import { FormEvent, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'

type EnquiryStatus = 'no-answer' | 'answered' | 'very-interested' | 'looking-for-quotes' | 'completed'

export interface Enquiry {
  id: string
  name: string
  contactNumber: string
  status: EnquiryStatus
  notes: string
  callBackDate: string
  fileUrls: string[]
  createdAt: { toDate: () => Date } | null
}

interface NewEnquiryModalProps {
  isOpen: boolean
  onClose: () => void
  editEnquiry?: Enquiry | null
}

function CustomSelect<T extends string>({ value, onChange, options }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
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

  const handleOpen = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((p) => !p)
  }

  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        </ul>,
        document.body
      )}
    </div>
  )
}

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const toDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }
  const toISO = (display: string) => {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
    if (!match) return ''
    const [, d, m, yy] = match
    return `20${yy}-${m}-${d}`
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
            <button type="button" onClick={() => { onChange(''); setTyped(''); setOpen(false) }} className="text-xs text-gray-400 hover:text-white">Clear</button>
            <button type="button" onClick={() => { onChange(todayStr); setTyped(toDisplay(todayStr)); setOpen(false) }} className="text-xs text-purple-400 hover:text-purple-300">Today</button>
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_OPTIONS: { value: EnquiryStatus; label: string }[] = [
  { value: 'no-answer', label: 'No Answer' },
  { value: 'answered', label: 'Answered' },
  { value: 'very-interested', label: 'Very Interested' },
  { value: 'looking-for-quotes', label: 'Looking for Quotes' },
  { value: 'completed', label: 'Completed' },
]

const EMPTY_FORM = {
  name: '',
  contactNumber: '',
  status: 'no-answer' as EnquiryStatus,
  notes: '',
  followUpDate: '',
  files: [] as File[],
}

export default function NewEnquiryModal({ isOpen, onClose, editEnquiry }: NewEnquiryModalProps) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    if (editEnquiry) {
      setFormData({
        name: editEnquiry.name,
        contactNumber: editEnquiry.contactNumber,
        status: editEnquiry.status,
        notes: editEnquiry.notes,
        followUpDate: editEnquiry.callBackDate,
        files: [],
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, editEnquiry])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editEnquiry) {
        const newUrls: string[] = []
        for (const file of formData.files) {
          const storageRef = ref(storage, `leads/${editEnquiry.id}/${file.name}`)
          await uploadBytes(storageRef, file)
          const url = await getDownloadURL(storageRef)
          newUrls.push(url)
        }
        await updateDoc(doc(db, 'leads', editEnquiry.id), {
          name: formData.name,
          contactNumber: formData.contactNumber,
          status: formData.status,
          notes: formData.notes,
          callBackDate: formData.followUpDate,
          fileUrls: [...(editEnquiry.fileUrls ?? []), ...newUrls],
        })
      } else {
        const docRef = await addDoc(collection(db, 'leads'), {
          name: formData.name,
          contactNumber: formData.contactNumber,
          status: formData.status,
          notes: formData.notes,
          callBackDate: formData.followUpDate,
          fileUrls: [],
          createdAt: serverTimestamp(),
        })
        if (formData.files.length > 0) {
          const urls: string[] = []
          for (const file of formData.files) {
            const storageRef = ref(storage, `leads/${docRef.id}/${file.name}`)
            await uploadBytes(storageRef, file)
            const url = await getDownloadURL(storageRef)
            urls.push(url)
          }
          await updateDoc(doc(db, 'leads', docRef.id), { fileUrls: urls })
        }
      }
      onClose()
    } catch (err) {
      setError('Failed to save enquiry. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return
    setFormData(p => ({ ...p, files: [...p.files, ...Array.from(incoming)] }))
  }

  const removeFile = (index: number) => {
    setFormData(p => ({ ...p, files: p.files.filter((_, i) => i !== index) }))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  if (!isOpen) return null

  const showCalendar = formData.status !== 'completed'
  const isLoading = saving

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="modal-scroll relative w-full max-w-lg max-h-[80vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">{editEnquiry ? 'Edit Enquiry' : 'New Enquiry'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-2xl px-4 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Number</label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData(p => ({ ...p, contactNumber: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <CustomSelect
              value={formData.status}
              onChange={(v) => setFormData(p => ({ ...p, status: v }))}
              options={STATUS_OPTIONS}
            />
          </div>

          {showCalendar && (
            <div>
              <label className="block text-sm font-medium mb-1">Call Back Date</label>
              <DatePicker
                value={formData.followUpDate}
                onChange={(v) => setFormData(p => ({ ...p, followUpDate: v }))}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 w-full px-4 py-6 bg-black/40 backdrop-blur-xl border border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-500">Drop files here or <span className="text-purple-400">browse</span></p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {formData.files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {formData.files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Saving...' : editEnquiry ? 'Save Changes' : 'Save Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
