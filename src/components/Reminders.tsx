import { useEffect, useState } from 'react'
import { Bell, X, Clock, CalendarDays, Loader2, Pencil, Trash2 } from 'lucide-react'
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

type Reminder = {
  id: string
  name: string
  notes: string
  time: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once'
  dates?: number[]
  weekdays?: string[]
  yearlyDate?: string
  onceDate?: string
  createdAt: Timestamp
}

export default function Reminders() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false)
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false)
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false)
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false)
  const [isOnceModalOpen, setIsOnceModalOpen] = useState(false)
  const [onceDate, setOnceDate] = useState('')
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([])

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const [yearlyMonth, setYearlyMonth] = useState('')
  const [yearlyDay, setYearlyDay] = useState('')

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const DAYS_IN_MONTH: Record<string, number> = {
    January: 31, February: 29, March: 31, April: 30, May: 31, June: 30,
    July: 31, August: 31, September: 30, October: 31, November: 30, December: 31,
  }
  const [selectedDates, setSelectedDates] = useState<number[]>([])
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'once' | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [time, setTime] = useState('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editTime, setEditTime] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isViewByDateOpen, setIsViewByDateOpen] = useState(false)
  const [viewDate, setViewDate] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'reminders'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remindersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reminder[]
      setReminders(remindersData)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsubscribe()
  }, [])

  const handleSaveReminder = async () => {
    if (!name.trim() || !time.trim() || !frequency) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'reminders'), {
        name: name.trim(),
        notes: notes.trim(),
        time,
        frequency,
        createdAt: Timestamp.fromDate(new Date()),
      })
      setName('')
      setNotes('')
      setTime('')
      setIsDailyModalOpen(false)
    } finally { setSaving(false) }
  }

  const handleSaveMonthlyReminder = async () => {
    if (!name.trim() || !time.trim() || selectedDates.length === 0) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'reminders'), {
        name: name.trim(),
        notes: notes.trim(),
        time,
        frequency: 'monthly',
        dates: selectedDates.sort((a, b) => a - b),
        createdAt: Timestamp.fromDate(new Date()),
      })
      setName('')
      setNotes('')
      setTime('')
      setSelectedDates([])
      setIsMonthlyModalOpen(false)
    } finally { setSaving(false) }
  }

  const toggleDate = (day: number) => {
    setSelectedDates((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSaveYearlyReminder = async () => {
    if (!name.trim() || !time.trim() || !yearlyMonth || !yearlyDay) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'reminders'), {
        name: name.trim(),
        notes: notes.trim(),
        time,
        frequency: 'yearly',
        yearlyDate: `${yearlyDay} ${yearlyMonth}`,
        createdAt: Timestamp.fromDate(new Date()),
      })
      setName('')
      setNotes('')
      setTime('')
      setYearlyMonth('')
      setYearlyDay('')
      setIsYearlyModalOpen(false)
    } finally { setSaving(false) }
  }

  const handleSaveOnceReminder = async () => {
    if (!name.trim() || !time.trim() || !onceDate) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'reminders'), {
        name: name.trim(),
        notes: notes.trim(),
        time,
        frequency: 'once',
        onceDate,
        createdAt: Timestamp.fromDate(new Date()),
      })
      setName('')
      setNotes('')
      setTime('')
      setOnceDate('')
      setIsOnceModalOpen(false)
    } finally { setSaving(false) }
  }

  const handleSaveWeeklyReminder = async () => {
    if (!name.trim() || !time.trim() || selectedWeekdays.length === 0) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'reminders'), {
        name: name.trim(),
        notes: notes.trim(),
        time,
        frequency: 'weekly',
        weekdays: selectedWeekdays,
        createdAt: Timestamp.fromDate(new Date()),
      })
      setName('')
      setNotes('')
      setTime('')
      setSelectedWeekdays([])
      setIsWeeklyModalOpen(false)
    } finally { setSaving(false) }
  }

  const toggleWeekday = (day: string) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const options = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'once', label: 'Just once' },
  ] as const

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Productivity</p>
          <h1 className="text-4xl font-semibold leading-tight">Reminders</h1>
        </header>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setViewDate(''); setIsViewByDateOpen(true) }}
            className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            View by Date
          </button>
          <button
            type="button"
            onClick={() => { setFrequency(null); setIsCreateModalOpen(true) }}
            className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            New Reminder
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-10 flex items-center justify-center animate-stack-up delay-100">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 animate-stack-up delay-100">
          <p className="text-sm">No reminders yet. Start by creating a new reminder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stack-up delay-100">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-3 hover:border-purple-500/30 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white truncate">{reminder.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-lg capitalize flex-shrink-0 ${
                    reminder.frequency === 'daily' ? 'bg-blue-400/10 text-blue-400' :
                    reminder.frequency === 'weekly' ? 'bg-green-400/10 text-green-400' :
                    reminder.frequency === 'monthly' ? 'bg-yellow-400/10 text-yellow-400' :
                    reminder.frequency === 'yearly' ? 'bg-orange-400/10 text-orange-400' :
                    'bg-pink-400/10 text-pink-400'
                  }`}>
                    {reminder.frequency === 'once' ? 'Just once' : reminder.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => { setEditingReminder(reminder); setEditName(reminder.name); setEditNotes(reminder.notes); setEditTime(reminder.time) }} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setDeleteConfirmId(reminder.id)} className="p-1.5 rounded-xl hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {reminder.notes && (
                <p className="text-sm text-gray-400 line-clamp-3">{reminder.notes}</p>
              )}
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {reminder.weekdays && reminder.weekdays.length > 0 && (
                    <>
                      <CalendarDays className="w-4 h-4 flex-shrink-0" />
                      <span>{reminder.weekdays.join(', ')}</span>
                    </>
                  )}
                  {reminder.dates && reminder.dates.length > 0 && (
                    <>
                      <CalendarDays className="w-4 h-4 flex-shrink-0" />
                      <span>Dates: {reminder.dates.join(', ')}</span>
                    </>
                  )}
                  {reminder.yearlyDate && (
                    <>
                      <CalendarDays className="w-4 h-4 flex-shrink-0" />
                      <span>{reminder.yearlyDate}</span>
                    </>
                  )}
                  {reminder.onceDate && (
                    <>
                      <CalendarDays className="w-4 h-4 flex-shrink-0" />
                      <span>{new Date(reminder.onceDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-sm ${
                  reminder.frequency === 'daily' ? 'text-blue-400' :
                  reminder.frequency === 'weekly' ? 'text-green-400' :
                  reminder.frequency === 'monthly' ? 'text-yellow-400' :
                  reminder.frequency === 'yearly' ? 'text-orange-400' :
                  'text-pink-400'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{reminder.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold">Delete Reminder</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete this reminder? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteDoc(doc(db, 'reminders', deleteConfirmId))
                  setDeleteConfirmId(null)
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingReminder(null)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">Edit Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingReminder(null)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (!editName.trim() || !editTime.trim()) return
                  setSaving(true)
                  try {
                    await updateDoc(doc(db, 'reminders', editingReminder.id), {
                      name: editName.trim(),
                      notes: editNotes.trim(),
                      time: editTime,
                    })
                    setEditingReminder(null)
                  } finally { setSaving(false) }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Update Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">New Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-400">How often should this reminder repeat?</p>
              <div className="grid grid-cols-2 gap-3">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFrequency(option.value)
                      if (option.value === 'daily') {
                        setIsCreateModalOpen(false)
                        setIsDailyModalOpen(true)
                      }
                      if (option.value === 'weekly') {
                        setIsCreateModalOpen(false)
                        setIsWeeklyModalOpen(true)
                      }
                      if (option.value === 'monthly') {
                        setIsCreateModalOpen(false)
                        setIsMonthlyModalOpen(true)
                      }
                      if (option.value === 'yearly') {
                        setIsCreateModalOpen(false)
                        setIsYearlyModalOpen(true)
                      }
                      if (option.value === 'once') {
                        setIsCreateModalOpen(false)
                        setIsOnceModalOpen(true)
                      }
                    }}
                    className={`px-4 py-3 rounded-2xl text-sm font-medium border transition-colors ${
                      frequency === option.value
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isWeeklyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWeeklyModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">Weekly Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsWeeklyModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="weekly-name" className="text-sm font-medium text-gray-400">Name</label>
                <input
                  id="weekly-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Reminder name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="weekly-notes" className="text-sm font-medium text-gray-400">Notes</label>
                <textarea
                  id="weekly-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Select Days</label>
                <div className="flex gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedWeekdays.includes(day)
                          ? 'bg-purple-600 text-white'
                          : 'bg-black/40 border border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="weekly-time" className="text-sm font-medium text-gray-400">Time</label>
                <input
                  id="weekly-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveWeeklyReminder}
                disabled={saving}
                className="w-full px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isYearlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsYearlyModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">Yearly Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsYearlyModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="yearly-name" className="text-sm font-medium text-gray-400">Name</label>
                <input
                  id="yearly-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Reminder name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="yearly-notes" className="text-sm font-medium text-gray-400">Notes</label>
                <textarea
                  id="yearly-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Date</label>
                <div className="flex gap-3">
                  <select
                    value={yearlyMonth}
                    onChange={(e) => { setYearlyMonth(e.target.value); setYearlyDay('') }}
                    className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    <option value="" disabled>Month</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-black text-gray-300">{m}</option>
                    ))}
                  </select>
                  <select
                    value={yearlyDay}
                    onChange={(e) => setYearlyDay(e.target.value)}
                    disabled={!yearlyMonth}
                    className="w-24 px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none disabled:opacity-40"
                  >
                    <option value="" disabled>Day</option>
                    {yearlyMonth && Array.from({ length: DAYS_IN_MONTH[yearlyMonth] }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-black text-gray-300">{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="yearly-time" className="text-sm font-medium text-gray-400">Time</label>
                <input
                  id="yearly-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveYearlyReminder}
                disabled={saving}
                className="w-full px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMonthlyModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">Monthly Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthlyModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="monthly-name" className="text-sm font-medium text-gray-400">Name</label>
                <input
                  id="monthly-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Reminder name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="monthly-notes" className="text-sm font-medium text-gray-400">Notes</label>
                <textarea
                  id="monthly-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Select Dates</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDate(day)}
                      className={`w-full aspect-square rounded-xl text-xs font-medium transition-colors ${
                        selectedDates.includes(day)
                          ? 'bg-purple-600 text-white'
                          : 'bg-black/40 border border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="monthly-time" className="text-sm font-medium text-gray-400">Time</label>
                <input
                  id="monthly-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveMonthlyReminder}
                disabled={saving}
                className="w-full px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOnceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOnceModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">One-Time Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOnceModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="once-name" className="text-sm font-medium text-gray-400">Name</label>
                <input
                  id="once-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Reminder name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="once-notes" className="text-sm font-medium text-gray-400">Notes</label>
                <textarea
                  id="once-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="once-date" className="text-sm font-medium text-gray-400">Date</label>
                <input
                  id="once-date"
                  type="date"
                  value={onceDate}
                  onChange={(e) => setOnceDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="once-time" className="text-sm font-medium text-gray-400">Time</label>
                <input
                  id="once-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveOnceReminder}
                disabled={saving}
                className="w-full px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDailyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDailyModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">Daily Reminder</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDailyModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reminder-name" className="text-sm font-medium text-gray-400">Name</label>
                <input
                  id="reminder-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Reminder name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reminder-notes" className="text-sm font-medium text-gray-400">Notes</label>
                <textarea
                  id="reminder-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reminder-time" className="text-sm font-medium text-gray-400">Time</label>
                <input
                  id="reminder-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveReminder}
                disabled={saving}
                className="w-full px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isViewByDateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewByDateOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-6 text-gray-300 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold">View by Date</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsViewByDateOpen(false)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">Select Date</label>
                <input
                  type="date"
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                />
              </div>
              {viewDate && (() => {
                const selected = new Date(viewDate + 'T00:00')
                const dayOfMonth = selected.getDate()
                const WEEKDAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const weekday = WEEKDAY_MAP[selected.getDay()]
                const monthName = selected.toLocaleString('en-US', { month: 'long' })
                const yearlyStr = `${dayOfMonth} ${monthName}`
                const isoStr = viewDate

                const filtered = reminders.filter((r) => {
                  if (r.frequency === 'daily') return true
                  if (r.frequency === 'weekly' && r.weekdays?.includes(weekday)) return true
                  if (r.frequency === 'monthly' && r.dates?.includes(dayOfMonth)) return true
                  if (r.frequency === 'yearly' && r.yearlyDate === yearlyStr) return true
                  if (r.frequency === 'once' && r.onceDate === isoStr) return true
                  return false
                })

                if (filtered.length === 0) return (
                  <p className="text-sm text-gray-500 pt-2">No reminders on this date.</p>
                )

                return (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-gray-400">{filtered.length} reminder{filtered.length > 1 ? 's' : ''} on this date</p>
                    {filtered.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/30 border border-white/10">
                        <div className="min-w-0">
                          <p className="text-base font-medium text-white truncate">{r.name}</p>
                          {r.notes && <p className="text-sm text-gray-400 truncate">{r.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`flex items-center gap-1 text-sm ${
                            r.frequency === 'daily' ? 'text-blue-400' :
                            r.frequency === 'weekly' ? 'text-green-400' :
                            r.frequency === 'monthly' ? 'text-yellow-400' :
                            r.frequency === 'yearly' ? 'text-orange-400' :
                            'text-pink-400'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{r.time}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium capitalize ${
                            r.frequency === 'daily' ? 'bg-blue-400/10 text-blue-400' :
                            r.frequency === 'weekly' ? 'bg-green-400/10 text-green-400' :
                            r.frequency === 'monthly' ? 'bg-yellow-400/10 text-yellow-400' :
                            r.frequency === 'yearly' ? 'bg-orange-400/10 text-orange-400' :
                            'bg-pink-400/10 text-pink-400'
                          }`}>{r.frequency === 'once' ? 'Just once' : r.frequency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
