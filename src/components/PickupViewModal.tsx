import { X } from 'lucide-react'

interface Pickup {
  id: string
  pickupNumber: string
  itemName: string
  price: string
  advance: string
  customerName: string
  phone: string
  address: string
  postcode: string
  pickupDate: string
  pickupStartTime: string
  pickupEndTime: string
  additionalNotes: string
  status: 'pending' | 'collected' | 'cancelled'
}

interface PickupViewModalProps {
  isOpen: boolean
  onClose: () => void
  pickup: Pickup | null
}

export default function PickupViewModal({ isOpen, onClose, pickup }: PickupViewModalProps) {
  if (!isOpen || !pickup) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card">
        <div className="sticky top-0 flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">Pickup Details</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-1">Pickup Number</p>
              <p className="text-base">{pickup.pickupNumber}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Item Name</p>
              <p className="text-base">{pickup.itemName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Price</p>
              <p className="text-base">${pickup.price}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Advance</p>
              <p className="text-base">${pickup.advance || '—'}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Customer Name</p>
              <p className="text-base">{pickup.customerName}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Phone</p>
              <p className="text-base">{pickup.phone}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm font-medium mb-1">Address</p>
              <p className="text-base">{pickup.address}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Postcode</p>
              <p className="text-base">{pickup.postcode}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Pickup Date</p>
              <p className="text-base">{pickup.pickupDate}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Pickup Start Time</p>
              <p className="text-base">{pickup.pickupStartTime}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Pickup End Time</p>
              <p className="text-base">{pickup.pickupEndTime}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <p className="text-base capitalize">{pickup.status}</p>
            </div>

            {pickup.additionalNotes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-1">Additional Notes</p>
                <p className="text-base">{pickup.additionalNotes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="btn border px-6">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
