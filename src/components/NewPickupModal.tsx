import { X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { FormEvent, useEffect, useState, useRef } from 'react'

interface PickupData {
  pickupNumber: string
  itemName: string
  price: string
  advance: string
  advanceDate: string
  customerName: string
  phone: string
  address: string
  postcode: string
  pickupDate: string
  pickupStartTime: string
  pickupEndTime: string
  additionalNotes: string
  status: 'pending' | 'collected' | 'cancelled'
}

interface NewPickupModalProps {
  isOpen: boolean
  onClose: () => void
  editPickup?: PickupData | null
  editId?: string | null
  onSave?: (pickup: PickupData & { id: string }) => void
}

export default function NewPickupModal({ isOpen, onClose, editPickup, editId, onSave }: NewPickupModalProps) {
  const [formData, setFormData] = useState<PickupData>({
    pickupNumber: '',
    itemName: '',
    price: '',
    advance: '',
    advanceDate: '',
    customerName: '',
    phone: '',
    address: '',
    postcode: '',
    pickupDate: '',
    pickupStartTime: '',
    pickupEndTime: '',
    additionalNotes: '',
    status: 'pending',
  })

  useEffect(() => {
    if (editPickup) {
      setFormData(editPickup)
    } else {
      setFormData({
        pickupNumber: '',
        itemName: '',
        price: '',
        advance: '',
        advanceDate: '',
        status: 'pending',
        customerName: '',
        phone: '',
        address: '',
        postcode: '',
        pickupDate: '',
        pickupStartTime: '',
        pickupEndTime: '',
        additionalNotes: '',
      })
    }
  }, [editPickup])

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const pickupRecord = {
      ...formData,
      id: editId || Date.now().toString(),
    }

    if (onSave) {
      onSave(pickupRecord)
    }

    onClose()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">{editPickup ? 'Edit Pickup' : 'New Pickup'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pickupNumber" className="block text-sm font-medium mb-1">
                Pickup Number
              </label>
              <input
                type="text"
                id="pickupNumber"
                name="pickupNumber"
                value={formData.pickupNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="itemName" className="block text-sm font-medium mb-1">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label htmlFor="advance" className="block text-sm font-medium mb-1">
                Advance
              </label>
              <input
                type="number"
                id="advance"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone
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

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address
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
              <label className="block text-sm font-medium mb-1">Pickup Date</label>
              <DatePicker
                value={formData.pickupDate}
                onChange={(v) => setFormData(p => ({ ...p, pickupDate: v }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pickup Start Time</label>
              <TimePicker
                value={formData.pickupStartTime}
                onChange={(v) => setFormData(p => ({ ...p, pickupStartTime: v }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pickup End Time</label>
              <TimePicker
                value={formData.pickupEndTime}
                onChange={(v) => setFormData(p => ({ ...p, pickupEndTime: v }))}
                required
                placeholder="03:30"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="additionalNotes" className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pending">Pending</option>
                <option value="collected">Collected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors">
              {editPickup ? 'Save Changes' : 'Create Pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
