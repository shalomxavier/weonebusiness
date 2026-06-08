import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Eye, Pencil, Trash2, Search, X, ChevronDown, LayoutList, PhoneMissed, PhoneCall, Flame, FileSearch, CheckCircle2, Phone, AlertCircle } from 'lucide-react'
import NewEnquiryModal, { Enquiry } from './NewEnquiryModal'
import EnquiryViewModal from './EnquiryViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'

type EnquiryStatus = 'no-answer' | 'answered' | 'very-interested' | 'looking-for-quotes' | 'got-booked' | 'completed-without-booking'
type FilterStatus = 'all' | EnquiryStatus

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'no-answer', label: 'No Answer' },
  { value: 'answered', label: 'Answered' },
  { value: 'very-interested', label: 'Very Interested' },
  { value: 'looking-for-quotes', label: 'Looking for Quotes' },
  { value: 'got-booked', label: 'Got Booked' },
  { value: 'completed-without-booking', label: 'Completed Without Booking' },
]

function OverdueModal({ isOpen, onClose, entries, onView, onEdit }: {
  isOpen: boolean
  onClose: () => void
  entries: Enquiry[]
  onView: (e: Enquiry) => void
  onEdit: (e: Enquiry) => void
}) {
  if (!isOpen) return null
  const fmt = (iso: string) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col backdrop-blur-2xl border border-white/10 rounded-3xl text-gray-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold">Overdue Entries</h2>
            <span className="text-xs bg-orange-400/10 text-orange-400 px-2 py-0.5 rounded-full">{entries.length}</span>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-2xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {entries.map(e => (
            <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/40 border border-orange-400/10">
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-white truncate">{e.name}</p>
                <p className="text-sm text-orange-400">{fmt(e.callBackDate)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                <button type="button" onClick={() => { onView(e); onClose() }} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                <button type="button" onClick={() => { onEdit(e); onClose() }} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusDropdown({ value, onChange }: { value: FilterStatus; onChange: (v: FilterStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = FILTER_OPTIONS.find(o => o.value === value)

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-3 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-base text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <span>{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute z-[200] mt-1 w-full bg-black rounded-2xl overflow-hidden shadow-xl">
          {FILTER_OPTIONS.map(opt => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === opt.value ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
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

const STATUS_CARD_CONFIGS: { status: FilterStatus; label: string; color: string; icon: React.ElementType }[] = [
  { status: 'all',                       label: 'Total',                     color: 'text-white',        icon: LayoutList    },
  { status: 'no-answer',                label: 'No Answer',                color: 'text-gray-400',     icon: PhoneMissed   },
  { status: 'answered',                 label: 'Answered',                 color: 'text-blue-400',     icon: PhoneCall     },
  { status: 'very-interested',         label: 'Very Interested',          color: 'text-green-400',    icon: Flame         },
  { status: 'looking-for-quotes',       label: 'Looking for Quotes',       color: 'text-yellow-400',   icon: FileSearch    },
  { status: 'got-booked',               label: 'Got Booked',               color: 'text-purple-400',   icon: CheckCircle2  },
  { status: 'completed-without-booking', label: 'Completed Without Booking', color: 'text-orange-400',   icon: CheckCircle2  },
]

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  'no-answer': 'No Answer',
  'answered': 'Answered',
  'very-interested': 'Very Interested',
  'looking-for-quotes': 'Looking for Quotes',
  'got-booked': 'Got Booked',
  'completed-without-booking': 'Completed Without Booking',
}

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  'no-answer': 'text-gray-400 bg-gray-400/10',
  'answered': 'text-blue-400 bg-blue-400/10',
  'very-interested': 'text-green-400 bg-green-400/10',
  'looking-for-quotes': 'text-yellow-400 bg-yellow-400/10',
  'got-booked': 'text-purple-400 bg-purple-400/10',
  'completed-without-booking': 'text-orange-400 bg-orange-400/10',
}

export default function Leads() {
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [overdueModalOpen, setOverdueModalOpen] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setEnquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Enquiry)))
    })
    return () => unsub()
  }, [])

  const fmt = (iso: string) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }

  const todayIso = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  const overdueEntries = useMemo(() =>
    enquiries.filter(e => e.callBackDate && e.callBackDate < todayIso && e.status !== 'got-booked' && e.status !== 'completed-without-booking')
  , [enquiries, todayIso])

  const next7Days = useMemo(() => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const count = enquiries.filter(e => e.callBackDate === iso && e.status !== 'got-booked' && e.status !== 'completed-without-booking').length
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' })
      const dateLabel = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      days.push({ iso, label, dateLabel, count, isToday: i === 0 })
    }
    return days
  }, [enquiries])

  const filtered = useMemo(() => {
    let result = [...enquiries]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.contactNumber.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter)
    }
    return result
  }, [enquiries, searchQuery, statusFilter])

  const handleView = (e: Enquiry) => { setSelectedEnquiry(e); setViewModalOpen(true) }
  const handleEdit = (e: Enquiry) => { setSelectedEnquiry(e); setEditModalOpen(true) }
  const handleDelete = (e: Enquiry) => { setSelectedEnquiry(e); setDeleteModalOpen(true) }

  const confirmDelete = async () => {
    if (!selectedEnquiry) return
    setDeleting(true)
    await deleteDoc(doc(db, 'leads', selectedEnquiry.id))
    setDeleting(false)
    setDeleteModalOpen(false)
    setSelectedEnquiry(null)
  }

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Productivity</p>
          <h1 className="text-4xl font-semibold leading-tight">Leads</h1>
        </header>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
        >
          New Enquiry
        </button>
      </div>

      {overdueEntries.length > 0 && (
        <button
          type="button"
          onClick={() => setOverdueModalOpen(true)}
          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors animate-stack-up"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>{overdueEntries.length}</strong> {overdueEntries.length === 1 ? 'entry needs' : 'entries need'} to be updated from past days
          </span>
          <Eye className="w-4 h-4" />
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-stack-up delay-100">
        {STATUS_CARD_CONFIGS.map(({ status, label, color, icon: Icon }) => {
          const count = status === 'all' ? enquiries.length : enquiries.filter(e => e.status === status).length
          return (
            <div
              key={status}
              className="flex flex-col gap-2 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
                <Icon className={`w-5 h-5 ${color} opacity-70`} />
              </div>
              <span className="text-sm text-gray-400 leading-tight">{label}</span>
            </div>
          )
        })}
      </div>

      {(() => {
        const todayIso = (() => {
          const t = new Date()
          return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
        })()
        const callToday = enquiries.filter(e => e.callBackDate === todayIso && e.status !== 'got-booked' && e.status !== 'completed-without-booking')
        if (callToday.length === 0) return null
        return (
          <div className="space-y-3 animate-stack-up delay-125">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold tracking-widest text-red-400 uppercase">Call Today</h2>
              <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full">{callToday.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {callToday.map(e => (
                <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-red-500/20">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-white truncate">{e.name}</p>
                    <p className="text-sm text-gray-400">{e.contactNumber}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`hidden sm:inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                    <button type="button" onClick={() => handleView(e)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleEdit(e)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 animate-stack-up delay-150">
        {next7Days.map(({ iso, label, dateLabel, count }) => (
          <div
            key={iso}
            className="flex flex-col gap-2 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${count > 0 ? 'text-white' : 'text-gray-600'}`}>{count}</span>
            </div>
            <div>
              <p className="text-sm font-medium leading-tight text-gray-300">{label}</p>
              <p className="text-xs text-gray-500">{dateLabel}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-4 w-full animate-stack-up delay-200">
        <div className="relative w-full sm:w-1/2 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black/40 backdrop-blur-xl rounded-2xl text-base text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="w-full sm:flex-1 sm:min-w-[160px]">
          <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
        </div>
        {(searchQuery || statusFilter !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setStatusFilter('all') }} className="text-sm text-gray-500 hover:text-gray-300 underline">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 animate-stack-up delay-200">
          <p className="text-sm">{enquiries.length === 0 ? 'No enquiries yet. Click “New Enquiry” to get started.' : 'No enquiries match your filters.'}</p>
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl animate-stack-up delay-200">
          <div className="overflow-x-auto rounded-3xl">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-base font-semibold">Name</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Call Back Date</th>
                  <th className="text-left px-4 py-3 text-base font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-base font-medium text-white">{e.name}</td>
                    <td className="px-4 py-3 text-base">{e.contactNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                        {STATUS_LABELS[e.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-base">{fmt(e.callBackDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleView(e)} className="p-1.5 rounded transition-colors hover:bg-white/10" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleEdit(e)} className="p-1.5 rounded transition-colors hover:bg-white/10" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(e)} className="p-1.5 rounded transition-colors hover:bg-white/10" title="Delete">
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

      <NewEnquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <NewEnquiryModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedEnquiry(null) }}
        editEnquiry={selectedEnquiry}
      />

      <EnquiryViewModal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedEnquiry(null) }}
        enquiry={selectedEnquiry}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedEnquiry(null) }}
        onConfirm={confirmDelete}
        title="Delete Enquiry"
        itemName={selectedEnquiry?.name}
        loading={deleting}
      />

      <OverdueModal
        isOpen={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
        entries={overdueEntries}
        onView={handleView}
        onEdit={handleEdit}
      />
    </section>
  )
}
