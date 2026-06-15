import { X, FileText, Image, ExternalLink } from 'lucide-react'

interface Order {
  id: string
  itemNumber: string
  itemName: string
  price: string
  advance: string
  advanceDate: string
  customerName: string
  phone: string
  address: string
  postcode: string
  deliveryDate: string
  deliveryStartTime: string
  deliveryEndTime: string
  additionalNotes: string
  paymentMethod?: 'card' | 'cash' | 'both'
  status?: 'pending' | 'delivered' | 'cancelled'
  attachments?: string[]
}

interface OrderViewModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export default function OrderViewModal({ isOpen, onClose, order }: OrderViewModalProps) {
  if (!isOpen || !order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">Order Details</h2>
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
              <p className="text-sm font-medium mb-1">Item Number</p>
              <p className="text-base">{order.itemNumber}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Item Name</p>
              <p className="text-base">{order.itemName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Price</p>
              <p className="text-base">${order.price}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Advance</p>
              <p className="text-base">${order.advance}</p>
            </div>

            {order.advanceDate && (
              <div>
                <p className="text-sm font-medium mb-1">Advance Date</p>
                <p className="text-base">{new Date(order.advanceDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Customer Name</p>
              <p className="text-base">{order.customerName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Phone</p>
              <p className="text-base">{order.phone}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium mb-1">Address</p>
              <p className="text-base">{order.address}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Postcode</p>
              <p className="text-base">{order.postcode}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Delivery Date</p>
              <p className="text-base">{order.deliveryDate}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Delivery Start Time</p>
              <p className="text-base">{order.deliveryStartTime}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Delivery End Time</p>
              <p className="text-base">{order.deliveryEndTime}</p>
            </div>

            {order.paymentMethod && (
              <div>
                <p className="text-sm font-medium mb-1">Payment Method</p>
                <p className="text-base capitalize">{order.paymentMethod}</p>
              </div>
            )}

            {order.additionalNotes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-1">Additional Notes</p>
                <p className="text-base">{order.additionalNotes}</p>
              </div>
            )}
          </div>

          {(order.attachments?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Attachments</p>
              <div className="space-y-2">
                {order.attachments!.map((url) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)
                  const fileName = (() => {
                    try {
                      const decoded = decodeURIComponent(url.split('/').pop()?.split('?')[0] || url)
                      const parts = decoded.split('_')
                      return parts.length > 1 ? parts.slice(1).join('_') : decoded
                    } catch { return url }
                  })()
                  return (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl hover:border-purple-500/40 transition-colors group"
                    >
                      {isImage ? <Image className="w-4 h-4 flex-shrink-0 text-purple-400" /> : <FileText className="w-4 h-4 flex-shrink-0 text-purple-400" />}
                      <span className="flex-1 text-sm text-gray-300 truncate group-hover:text-white">{fileName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

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
