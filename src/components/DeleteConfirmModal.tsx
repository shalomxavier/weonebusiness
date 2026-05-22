import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  orderName?: string
  title?: string
  message?: string
  itemName?: string
  loading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  orderName,
  title = 'Delete Order',
  message,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  const displayName = itemName || orderName || 'this item'
  const defaultMessage = `Are you sure you want to delete ${title.toLowerCase().includes('user') ? '' : 'the order for '}<strong>${displayName}</strong>? This action cannot be undone.`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-6" dangerouslySetInnerHTML={{ __html: message || defaultMessage }} />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2"
                disabled={loading}
              >
                {loading && <div className="relative w-4 h-4">
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                </div>}
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
