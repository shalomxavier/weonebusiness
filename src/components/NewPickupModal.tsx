import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

interface PickupData {
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

interface NewPickupModalProps {
  isOpen: boolean
  onClose: () => void
  editPickup?: PickupData | null
  onSave?: (pickup: PickupData & { id: string }) => void
}

export default function NewPickupModal({ isOpen, onClose, editPickup, onSave }: NewPickupModalProps) {
  const [formData, setFormData] = useState<PickupData>({
    pickupNumber: '',
    itemName: '',
    price: '',
    advance: '',
    customerName: '',
    phone: '',
    address: '',
    postcode: '',
    pickupDate: '',
    pickupStartTime: '',
    pickupEndTime: '',
    additionalNotes: '',
    status: 'pending',
  })

  useEffect(() => {
    if (editPickup) {
      setFormData(editPickup)
    } else {
      setFormData({
        pickupNumber: '',
        itemName: '',
        price: '',
        advance: '',
        status: 'pending',
        customerName: '',
        phone: '',
        address: '',
        postcode: '',
        pickupDate: '',
        pickupStartTime: '',
        pickupEndTime: '',
        additionalNotes: '',
      })
    }
  }, [editPickup])

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const pickupRecord = {
      ...formData,
      id: editPickup ? editPickup.pickupNumber : Date.now().toString(),
    }

    if (onSave) {
      onSave(pickupRecord)
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card">
        <div className="sticky top-0 flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-2xl font-semibold">{editPickup ? 'Edit Pickup' : 'New Pickup'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pickupNumber" className="block text-sm font-medium mb-1">
                Pickup Number
              </label>
              <input
                type="text"
                id="pickupNumber"
                name="pickupNumber"
                value={formData.pickupNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="itemName" className="block text-sm font-medium mb-1">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="advance" className="block text-sm font-medium mb-1">
                Advance
              </label>
              <input
                type="number"
                id="advance"
                name="advance"
                value={formData.advance}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium mb-1">
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="pickupDate" className="block text-sm font-medium mb-1">
                Pickup Date
              </label>
              <input
                type="date"
                id="pickupDate"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="pickupStartTime" className="block text-sm font-medium mb-1">
                Pickup Start Time
              </label>
              <input
                type="time"
                id="pickupStartTime"
                name="pickupStartTime"
                value={formData.pickupStartTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="pickupEndTime" className="block text-sm font-medium mb-1">
                Pickup End Time
              </label>
              <input
                type="time"
                id="pickupEndTime"
                name="pickupEndTime"
                value={formData.pickupEndTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="additionalNotes" className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              >
                <option value="pending">Pending</option>
                <option value="collected">Collected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn border px-6">
              Cancel
            </button>
            <button type="submit" className="btn border px-6">
              {editPickup ? 'Save Changes' : 'Create Pickup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
