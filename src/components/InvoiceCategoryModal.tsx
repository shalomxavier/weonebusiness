import { X, Truck, Trash2, ShoppingBag, LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export type InvoiceCategory = 'clearance' | 'removal' | 'used_goods'

export const INVOICE_CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  clearance: 'Clearance',
  removal: 'Removal',
  used_goods: 'Used Goods',
}

const CATEGORY_OPTIONS: { value: InvoiceCategory; label: string; icon: LucideIcon }[] = [
  { value: 'clearance', label: 'Clearance', icon: Trash2 },
  { value: 'removal', label: 'Removal', icon: Truck },
  { value: 'used_goods', label: 'Used Goods', icon: ShoppingBag },
]

interface InvoiceCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: (category: InvoiceCategory) => void
}

export default function InvoiceCategoryModal({ isOpen, onClose, onContinue }: InvoiceCategoryModalProps) {
  const [selected, setSelected] = useState<InvoiceCategory | null>(null)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelected(null)
      setContinuing(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (category: InvoiceCategory) => {
    if (continuing) return
    setSelected(category)
    setContinuing(true)
    onContinue(category)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="modal-scroll relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">Create New Invoice</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">Select the invoice category to continue.</p>

        <div className="space-y-3">
          {CATEGORY_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-colors ${
                  isSelected
                    ? 'bg-purple-600/20 border-purple-500/50 text-white'
                    : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-purple-500/30' : 'bg-white/5'
                }`}>
                  <opt.icon className={`w-5 h-5 ${isSelected ? 'text-purple-300' : 'text-gray-400'}`} />
                </div>
                <span className="text-base font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
