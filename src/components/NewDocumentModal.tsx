import { X } from 'lucide-react'
import { FormEvent } from 'react'

export type DocumentType = 'quotation' | 'invoice' | 'receipt'

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  quotation: 'Quotation',
  invoice: 'Invoice',
  receipt: 'Receipt',
}

interface NewDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  docType: DocumentType
}

export default function NewDocumentModal({ isOpen, onClose, docType }: NewDocumentModalProps) {
  if (!isOpen) return null

  const label = DOCUMENT_LABELS[docType]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="modal-scroll relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">New {label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium mb-1">
              Customer Name
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="documentDate" className="block text-sm font-medium mb-1">
              {label} Date
            </label>
            <input
              id="documentDate"
              name="documentDate"
              type="date"
              style={{ colorScheme: 'dark' }}
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <p className="text-xs text-gray-500">Saving documents will be enabled in a future update.</p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-sm hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled
              className="px-4 py-2 rounded-2xl text-sm bg-purple-600 text-white opacity-50 cursor-not-allowed"
            >
              Create {label}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
