import { X } from 'lucide-react'

interface Expense {
  id: string
  type: string
  amount: string
  date: string
  notes: string
}

interface ExpenseViewModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
}

export default function ExpenseViewModal({ isOpen, onClose, expense }: ExpenseViewModalProps) {
  if (!isOpen || !expense) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">Expense Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-1">Type</p>
              <p className="text-base capitalize">{expense.type}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Amount</p>
              <p className="text-base">${expense.amount}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Date</p>
              <p className="text-base">{expense.date}</p>
            </div>

            {expense.notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-base">{expense.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
