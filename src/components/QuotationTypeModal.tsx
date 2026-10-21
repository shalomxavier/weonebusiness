import { House, LucideIcon, PackageOpen, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type QuotationType = 'removals' | 'full_house_clearance' | 'part_house_clearance'

export const QUOTATION_TYPE_LABELS: Record<QuotationType, string> = {
  removals: 'Removals',
  full_house_clearance: 'Full House Clearance',
  part_house_clearance: 'Part House Clearance',
}

const QUOTATION_OPTIONS: { value: QuotationType; label: string; icon: LucideIcon }[] = [
  { value: 'removals', label: 'Removals', icon: Truck },
  { value: 'full_house_clearance', label: 'Full House Clearance', icon: House },
  { value: 'part_house_clearance', label: 'Part House Clearance', icon: PackageOpen },
]

interface QuotationTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: (quotationType: QuotationType) => void
}

export default function QuotationTypeModal({ isOpen, onClose, onContinue }: QuotationTypeModalProps) {
  const [selected, setSelected] = useState<QuotationType | null>(null)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSelected(null)
      setContinuing(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (type: QuotationType) => {
    if (continuing) return
    setSelected(type)
    setContinuing(true)
    onContinue(type)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="modal-scroll relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">Create New Quotation</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">Select the quotation type to continue.</p>

        <div className="space-y-3">
          {QUOTATION_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                disabled={continuing}
                aria-pressed={isSelected}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-colors disabled:cursor-not-allowed ${
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

        <div className="flex items-center justify-end pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={continuing}
            className="px-4 py-2 rounded-2xl text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
