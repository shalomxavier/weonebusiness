import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface BreakdownTransaction {
  id: string
  title: string
  subtitle?: string
  amount: number
  date?: string
  status?: string
}

interface BreakdownCategory {
  label: string
  value: number
  count: number
  transactions: BreakdownTransaction[]
}

interface BreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  total: string
  categories: BreakdownCategory[]
}

function TransactionItem({ transaction }: { transaction: BreakdownTransaction }) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered':
      case 'collected':
        return 'text-green-400'
      case 'pending':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{transaction.title.charAt(0).toUpperCase() + transaction.title.slice(1)}</p>
        {transaction.date && (
          <p className="text-xs text-gray-600">{new Date(transaction.date).toLocaleDateString('en-GB')}</p>
        )}
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-medium text-white">£{transaction.amount.toFixed(2)}</p>
        {transaction.status && (
          <p className={`text-xs ${getStatusColor(transaction.status)} capitalize`}>{transaction.status}</p>
        )}
      </div>
    </div>
  )
}

function CategorySection({ category }: { category: BreakdownCategory }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-300 font-medium">{category.label}</span>
          <span className="text-xs text-gray-500">({category.count} items)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">£{category.value.toFixed(2)}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      
      {isExpanded && category.transactions.length > 0 && (
        <div className="p-3 space-y-2 bg-black/20">
          {category.transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BreakdownModal({ isOpen, onClose, title, total, categories }: BreakdownModalProps) {
  if (!isOpen) return null

  const allTransactions = categories.flatMap(c => c.transactions)
  const totalCount = allTransactions.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[85vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900/50">
          <div>
            <h2 className="text-lg font-semibold text-white">{title} Breakdown</h2>
            <p className="text-xs text-gray-500">{totalCount} transactions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="text-center mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold text-white">{total}</p>
          </div>
          
          <div className="space-y-3">
            {categories.map((category, index) => (
              <CategorySection key={index} category={category} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
