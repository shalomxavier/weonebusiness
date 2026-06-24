import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, query, orderBy, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { LogIn, LogOut, Check, X, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface AttendanceRecord {
  id: string
  userId: string
  userCode: string
  userName: string
  userEmail: string
  clockIn: Timestamp
  clockOut: Timestamp | null
  clockInApproved: boolean
  clockOutApproved: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDuration(clockIn: Date, clockOut: Date): string {
  const secs = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function ApprovalTable() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editField, setEditField] = useState<'clockIn' | 'clockOut'>('clockIn')
  const [editTime, setEditTime] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'attendance'), orderBy('clockIn', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord)))
      setLoading(false)
    }, (e) => {
      console.error('Failed to load attendance', e)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const pendingRecords = useMemo(() => {
    return records.filter((r) => {
      const hasPendingApproval = !r.clockInApproved || (r.clockOut && !r.clockOutApproved)
      return hasPendingApproval
    })
  }, [records])

  const handleApproveClockIn = async (record: AttendanceRecord) => {
    try {
      await updateDoc(doc(db, 'attendance', record.id), { clockInApproved: true })
    } catch (e) {
      console.error('Failed to approve clock-in', e)
    }
  }

  const handleApproveClockOut = async (record: AttendanceRecord) => {
    try {
      await updateDoc(doc(db, 'attendance', record.id), { clockOutApproved: true })
    } catch (e) {
      console.error('Failed to approve clock-out', e)
    }
  }

  const handleReject = async (record: AttendanceRecord) => {
    try {
      await deleteDoc(doc(db, 'attendance', record.id))
    } catch (e) {
      console.error('Failed to reject record', e)
    }
  }

  const handleApproveAll = async () => {
    try {
      const updates = pendingRecords.map(r => {
        const updates: any = {}
        if (!r.clockInApproved) updates.clockInApproved = true
        if (r.clockOut && !r.clockOutApproved) updates.clockOutApproved = true
        return updateDoc(doc(db, 'attendance', r.id), updates)
      })
      await Promise.all(updates)
    } catch (e) {
      console.error('Failed to approve all records', e)
    }
  }

  const handleApproveSelected = async () => {
    try {
      const updates = Array.from(selectedIds).map(id => {
        const record = pendingRecords.find(r => r.id === id)
        if (!record) return Promise.resolve()
        const updates: any = {}
        if (!record.clockInApproved) updates.clockInApproved = true
        if (record.clockOut && !record.clockOutApproved) updates.clockOutApproved = true
        return updateDoc(doc(db, 'attendance', id), updates)
      })
      await Promise.all(updates)
      setSelectedIds(new Set())
      setSelectionMode(false)
    } catch (e) {
      console.error('Failed to approve selected records', e)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRecords.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingRecords.map(r => r.id)))
    }
  }

  const handleEdit = (record: AttendanceRecord, field: 'clockIn' | 'clockOut') => {
    setEditingRecord(record)
    setEditField(field)
    const time = field === 'clockIn' ? record.clockIn.toDate() : record.clockOut?.toDate()
    if (time) {
      setEditTime(time.toISOString().slice(0, 16))
    }
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord || !editTime) return
    try {
      const newTimestamp = Timestamp.fromDate(new Date(editTime))
      await updateDoc(doc(db, 'attendance', editingRecord.id), {
        [editField]: newTimestamp,
        [editField === 'clockIn' ? 'clockInApproved' : 'clockOutApproved']: false
      })
      setEditModalOpen(false)
      setEditingRecord(null)
      setEditTime('')
    } catch (e) {
      console.error('Failed to update time', e)
    }
  }

  if (loading) return null

  if (pendingRecords.length === 0) return null

  if (!isOwner) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Pending Approvals</h2>
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            {pendingRecords.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()) }}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              selectionMode
                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            {selectionMode ? 'Cancel' : 'Select'}
          </button>
          {selectionMode && selectedIds.size > 0 && (
            <button
              onClick={handleApproveSelected}
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
            >
              Approve Selected ({selectedIds.size})
            </button>
          )}
          {!selectionMode && (
            <button
              onClick={handleApproveAll}
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
            >
              Approve All
            </button>
          )}
        </div>
      </div>

      <div className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-yellow-500/20 text-left">
                {selectionMode && (
                  <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase w-10">
                    <label className="relative flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === pendingRecords.length && pendingRecords.length > 0}
                        onChange={toggleSelectAll}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 rounded border-2 border-yellow-500/50 bg-yellow-500/10 peer-checked:bg-yellow-500 peer-checked:border-yellow-500 transition-colors flex items-center justify-center">
                        <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </label>
                  </th>
                )}
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">User</th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                  <span className="flex items-center gap-1"><LogIn className="w-3.5 h-3.5" /> In</span>
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">
                  <span className="flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Out</span>
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase">Duration</th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase text-center">Clock In</th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase text-center">Clock Out</th>
                <th className="px-5 py-3.5 text-xs font-semibold tracking-widest text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRecords.map((record, idx) => {
                const clockInDate = record.clockIn.toDate()
                const clockOutDate = record.clockOut ? record.clockOut.toDate() : null
                return (
                  <tr
                    key={record.id}
                    className={`border-b border-yellow-500/10 last:border-0 transition-colors hover:bg-yellow-500/5 ${idx % 2 === 0 ? '' : 'bg-yellow-500/[0.02]'}`}
                  >
                    {selectionMode && (
                      <td className="px-5 py-3.5">
                        <label className="relative flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(record.id)}
                            onChange={() => toggleSelection(record.id)}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded border-2 border-yellow-500/50 bg-yellow-500/10 peer-checked:bg-yellow-500 peer-checked:border-yellow-500 transition-colors flex items-center justify-center">
                            <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                        </label>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium">{record.userName}</p>
                      <p className="text-xs text-gray-500">{record.userEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">{formatDate(clockInDate)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono">{formatTime(clockInDate)}</span>
                        <button
                          onClick={() => handleEdit(record, 'clockIn')}
                          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Edit clock-in time"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-mono">
                          {clockOutDate ? formatTime(clockOutDate) : <span className="text-gray-600">—</span>}
                        </span>
                        {clockOutDate && (
                          <button
                            onClick={() => handleEdit(record, 'clockOut')}
                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit clock-out time"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white font-mono">
                      {clockOutDate ? formatDuration(clockInDate, clockOutDate) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {record.clockInApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveClockIn(record)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {!clockOutDate ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : record.clockOutApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveClockOut(record)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleReject(record)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Time Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-sm backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-gray-300">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit {editField === 'clockIn' ? 'Clock In' : 'Clock Out'} Time
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {editingRecord?.userName}
            </p>
            <input
              type="datetime-local"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-purple-600 rounded-xl text-white hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
