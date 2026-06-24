import { X, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Paperclip, FileText, Image, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

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
  type: 'removal' | 'clearance' | 'man_with_van'
  attachments?: string[]
}

interface NewRemovalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (order: RemovalOrder, newFiles: File[]) => void
  editRemoval?: Omit<RemovalOrder, 'id'> | null
  editId?: string | null
}

const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'both', label: 'Both' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

const TYPE_OPTIONS = [
  { value: 'removal', label: 'Removal' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'man_with_van', label: 'Man with Van' },
]

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

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

const emptyRemoval: Omit<RemovalOrder, 'id'> = {
  customerName: '',
  email: '',
  phone: '',
  postcode: '',
  address: '',
  notes: '',
  removalDate: getTodayDate(),
  totalPrice: '',
  advance: '',
  advanceDate: '',
  startTime: '',
  endTime: '',
  paymentMethod: 'card',
  status: 'pending',
  type: 'removal',
  attachments: [],
}

export default function NewRemovalModal({ isOpen, onClose, onSave, editRemoval, editId }: NewRemovalModalProps) {
  const [formData, setFormData] = useState<Omit<RemovalOrder, 'id'>>(emptyRemoval)
  const [newFiles, setNewFiles] = useState<File[]>([])

  useEffect(() => {
    if (editRemoval) {
      setFormData(editRemoval)
    } else {
      setFormData({ ...emptyRemoval, removalDate: getTodayDate() })
    }
    setNewFiles([])
  }, [editRemoval, isOpen])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const orderData = {
      ...formData,
      id: editId ?? Date.now().toString(),
    } as RemovalOrder
    if (onSave) {
      onSave(orderData, newFiles)
    }
    onClose()
    setFormData({ ...emptyRemoval, removalDate: getTodayDate() })
    setNewFiles([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setNewFiles(prev => [...prev, ...Array.from(files)])
      e.target.value = ''
    }
  }

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingAttachment = (url: string) => {
    setFormData(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a !== url) }))
  }

  const getFileIcon = (nameOrUrl: string) => {
    const lower = nameOrUrl.toLowerCase()
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) return <Image className="w-4 h-4 flex-shrink-0" />
    return <FileText className="w-4 h-4 flex-shrink-0" />
  }

  const getFileName = (url: string) => {
    try {
      const decoded = decodeURIComponent(url.split('/').pop()?.split('?')[0] || url)
      const parts = decoded.split('_')
      return parts.length > 1 ? parts.slice(1).join('_') : decoded
    } catch { return url }
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

function TimePicker({ value, onChange, placeholder = '14:30' }: { value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  const toDisplay = (iso: string) => {
    if (!iso) return ''
    const [hStr, mStr] = iso.split(':')
    return `${hStr.padStart(2, '0')}:${mStr}`
  }

  const [typed, setTyped] = useState(() => toDisplay(value))
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTyped(toDisplay(value)) }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key
    const cur = typed

    if (key === 'Backspace') {
      e.preventDefault()
      const stripped = cur.replace(/[^0-9]/g, '')
      const next = stripped.slice(0, -1)
      setTyped(next)
      return
    }

    if (!/^[0-9]$/.test(key)) return
    e.preventDefault()

    const digits = cur.replace(/[^0-9]/g, '')
    const d = digits + key
    let next = ''

    if (d.length === 1) {
      next = d
    } else if (d.length === 2) {
      const h = parseInt(d)
      if (h > 23) {
        next = `0${d[0]}:${d[1]}`
      } else {
        next = `${d}:`
      }
    } else if (d.length === 3) {
      next = `${d.slice(0,2)}:${d[2]}`
    } else if (d.length === 4) {
      const m = Math.min(parseInt(d.slice(2,4)), 59)
      next = `${d.slice(0,2)}:${String(m).padStart(2,'0')}`
    } else {
      return
    }

    setTyped(next)
    commitDisplay(next)
  }

  const commitDisplay = (display: string) => {
    const match = display.match(/^(\d{2}):(\d{2})$/)
    if (!match) return
    const h = parseInt(match[1]), m = parseInt(match[2])
    if (h > 23 || m > 59) return
    onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); if (!typed) onChange('') }}
        placeholder={focused ? '' : placeholder}
        className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  )
}

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">{editId ? 'Edit Removal' : 'New Removal'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium mb-1">
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <CustomSelect
                value={formData.type}
                onChange={(v) => setFormData(p => ({ ...p, type: v }))}
                options={TYPE_OPTIONS as { value: 'removal' | 'clearance' | 'man_with_van'; label: string }[]}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Removal Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Removal Date</label>
              <DatePicker
                value={formData.removalDate}
                onChange={(v) => setFormData(p => ({ ...p, removalDate: v }))}
                required
              />
            </div>

            <div>
              <label htmlFor="totalPrice" className="block text-sm font-medium mb-1">
                Total Price (£)
              </label>
              <input
                type="number"
                id="totalPrice"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="advance" className="block text-sm font-medium mb-1">
                Advance Amount
              </label>
              <input
                type="number"
                id="advance"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {formData.advance && (
              <div>
                <label className="block text-sm font-medium mb-1">Advance Date</label>
                <DatePicker
                  value={formData.advanceDate}
                  onChange={(v) => setFormData(p => ({ ...p, advanceDate: v }))}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <CustomSelect
                value={formData.paymentMethod}
                onChange={(v) => setFormData(p => ({ ...p, paymentMethod: v }))}
                options={PAYMENT_METHODS as { value: 'card' | 'cash' | 'both'; label: string }[]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <CustomSelect
                value={formData.status}
                onChange={(v) => setFormData(p => ({ ...p, status: v }))}
                options={STATUS_OPTIONS as { value: 'pending' | 'completed'; label: string }[]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <TimePicker
                value={formData.startTime}
                onChange={(v) => setFormData(p => ({ ...p, startTime: v }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <TimePicker
                value={formData.endTime}
                onChange={(v) => setFormData(p => ({ ...p, endTime: v }))}
                required
                placeholder="15:30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attachments</label>
            <label className="block border border-dashed border-white/20 rounded-2xl p-4 bg-black/20 cursor-pointer hover:border-purple-500/50 transition-colors">
              <div className="flex items-center gap-2 text-gray-400 pointer-events-none">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm">Attach files</span>
              </div>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {((formData.attachments?.length ?? 0) > 0 || newFiles.length > 0) && (
              <div className="mt-3 space-y-2">
                {(formData.attachments || []).map((url) => (
                  <div key={url} className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl">
                    {getFileIcon(url)}
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-gray-300 truncate hover:text-white transition-colors">
                      {getFileName(url)}
                    </a>
                    <button type="button" onClick={() => removeExistingAttachment(url)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {newFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    {getFileIcon(file.name)}
                    <span className="flex-1 text-sm text-gray-300 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeNewFile(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              {editId ? 'Update Removal' : 'Save Removal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
