import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

interface Expense {
  id: string
  type: string
  amount: string
  date: string
  notes: string
}

interface NewExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (expense: Omit<Expense, 'id'>) => void
  editExpense?: Expense | null
}

const EXPENSE_TYPES = [
  'diesel',
  'salary',
  'cleaning maintenance',
  'rent',
  'food',
  'insurance',
  'other',
]

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export default function NewExpenseModal({ isOpen, onClose, onSave, editExpense }: NewExpenseModalProps) {
  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    type: '',
    amount: '',
    date: getTodayDate(),
    notes: '',
  })

  useEffect(() => {
    if (editExpense) {
      setFormData({
        type: editExpense.type,
        amount: editExpense.amount,
        date: editExpense.date,
        notes: editExpense.notes,
      })
    } else {
      setFormData({
        type: '',
        amount: '',
        date: getTodayDate(),
        notes: '',
      })
    }
  }, [editExpense])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSave) {
      onSave(formData)
    }
    onClose()
    setFormData({
      type: '',
      amount: '',
      date: getTodayDate(),
      notes: '',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto card">
        <div className="sticky top-0 flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">{editExpense ? 'Edit Expense' : 'New Expense'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md transition-colors"
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
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              >
                <option value="" disabled>Select expense type</option>
                {EXPENSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                placeholder="Enter amount"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                placeholder="Enter additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
