import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

interface AttendanceRecord {
  id: string
  userId: string
  userCode: string
  userName: string
  userEmail: string
  clockIn: Timestamp
  clockOut: Timestamp | null
}

type ToastType = 'in' | 'out'

interface ToastData {
  type: ToastType
  time: string
  name: string
  duration?: string
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return [h, m].map((v) => String(v).padStart(2, '0')).join(':')
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + formatTime(date)
}

export default function ClockIn({ fullWidth }: { fullWidth?: boolean } = {}) {
  const { user } = useAuth()
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Real-time listener for open clock-in — syncs across devices instantly
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', user.uid),
      where('clockOut', '==', null)
    )
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const sorted = snap.docs.sort((a, b) => {
          const aTime = a.data().clockIn?.toMillis?.() ?? 0
          const bTime = b.data().clockIn?.toMillis?.() ?? 0
          return bTime - aTime
        })
        const d = sorted[0]
        setActiveRecord({ id: d.id, ...d.data() } as AttendanceRecord)
      } else {
        setActiveRecord(null)
      }
      setLoading(false)
    }, (e) => {
      console.error('Failed to load attendance', e)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user])

  // Live elapsed timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (activeRecord) {
      const tick = () => {
        const secs = Math.floor((Date.now() - activeRecord.clockIn.toDate().getTime()) / 1000)
        setElapsed(secs)
      }
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      setElapsed(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeRecord])

  const showToast = (data: ToastData) => {
    setToast(data)
  }

  const handleClockIn = async () => {
    if (!user || submitting) return
    setSubmitting(true)
    try {
      const now = Timestamp.now()
      // Fetch custom 3-digit userId from users collection
      let userCode = ''
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (userSnap.exists()) userCode = userSnap.data().userId || ''
      } catch { /* fallback to empty */ }
      const data = {
        userId: user.uid,
        userCode,
        userName: user.displayName || user.email || 'Unknown',
        userEmail: user.email || '',
        clockIn: now,
        clockOut: null,
      }
      const ref = await addDoc(collection(db, 'attendance'), data)
      setActiveRecord({ id: ref.id, ...data })
      showToast({ type: 'in', time: formatDateTime(now.toDate()), name: data.userName })
    } catch (e) {
      console.error('Clock-in failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClockOut = async () => {
    if (!user || !activeRecord || submitting) return
    setSubmitting(true)
    try {
      const now = Timestamp.now()
      await updateDoc(doc(db, 'attendance', activeRecord.id), { clockOut: now })
      showToast({ type: 'out', time: formatDateTime(now.toDate()), name: activeRecord.userName, duration: formatDurationShort(elapsed) })
      setActiveRecord(null)
    } catch (e) {
      console.error('Clock-out failed', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  const isClockedIn = !!activeRecord

  return (
    <>
      {/* Clock-in / Clock-out button + live duration */}
      <div className={`flex items-stretch gap-3${fullWidth ? ' w-full' : ''}`}>
        <button
          type="button"
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={submitting}
          className={`flex items-center justify-center px-5 py-3 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'flex-1 basis-0 min-w-0' : ''} ${
            isClockedIn
              ? 'bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20'
              : 'bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20'
          }`}
        >
          {fullWidth ? (
            <div className="text-center">
              <p className="text-xs invisible">_</p>
              <p className="text-xl font-bold text-white">{submitting ? '...' : isClockedIn ? 'Clock Out' : 'Clock In'}</p>
              <p className="text-xs invisible">_</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white">
              {submitting ? '...' : isClockedIn ? 'Clock Out' : 'Clock In'}
            </p>
          )}
        </button>
        {isClockedIn && (
          <div className={`flex items-center justify-center px-5 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl ${fullWidth ? 'flex-1 basis-0 min-w-0' : ''}`}>
            {fullWidth ? (
              <div className="text-center">
                <p className="text-xs invisible">_</p>
                <p className="text-xl font-bold text-white">{formatDuration(elapsed)}</p>
                <p className="text-xs invisible">_</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white">{formatDuration(elapsed)}</p>
            )}
          </div>
        )}
      </div>

      {/* Modal — portalled to body so it covers full viewport incl. sidebar */}
      {toast && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setToast(null)} />
          <div className="relative w-full max-w-sm backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center text-gray-300">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              toast.type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <CheckCircle2 className={`w-8 h-8 ${toast.type === 'in' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <h3 className={`text-xl font-bold mb-1 ${toast.type === 'in' ? 'text-green-300' : 'text-red-300'}`}>
              {toast.type === 'in' ? 'Clocked In' : 'Clocked Out'}
            </h3>
            <p className="text-base text-gray-200 font-medium">{toast.name}</p>
            {toast.duration ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Working Hours</p>
                <p className="text-2xl font-mono font-bold text-white">{toast.duration}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">{toast.time}</p>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className={`mt-6 w-full py-2.5 rounded-2xl font-semibold text-white transition-colors ${
                toast.type === 'in'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
