import { X, Loader2, ChevronDown, Search } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { collection, doc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { InvoiceDocument } from './UsedGoodsInvoicePdf'

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
  paymentMethod: 'card' | 'cash' | 'both'
  status: 'pending' | 'delivered' | 'cancelled'
  cardAmount?: string
  cashAmount?: string
  attachments?: string[]
}

interface UsedGoodsInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  editInvoice?: InvoiceDocument | null
}

const inputClass =
  'w-full px-3 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500'

const readOnlyClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-2xl text-gray-400 cursor-not-allowed'

export default function UsedGoodsInvoiceModal({ isOpen, onClose, editInvoice }: UsedGoodsInvoiceModalProps) {
  const { user } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const [itemQuery, setItemQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const [bankDetails, setBankDetails] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputWrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const resetForm = () => {
    setItemQuery('')
    setSelectedOrder(null)
    setListOpen(false)
    setBankDetails('')
    setInvoiceNumber('')
    setError(null)
    setSaving(false)
  }

  useEffect(() => {
    if (!isOpen) return
    resetForm()
    if (editInvoice) {
      setItemQuery(editInvoice.itemNumber || '')
      setBankDetails(editInvoice.bankDetails || '')
      setInvoiceNumber('')
    }
    const load = async () => {
      setOrdersLoading(true)
      setOrdersError(null)
      try {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('deliveryDate', 'desc')))
        const loadedOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
        setOrders(loadedOrders)
        if (editInvoice) {
          const linkedOrder = loadedOrders.find((order) => order.id === editInvoice.orderId)
          if (linkedOrder) {
            setSelectedOrder(linkedOrder)
            setItemQuery(linkedOrder.itemNumber)
          } else {
            setError('The linked order could not be found. Select an existing order to continue.')
          }
        }
      } catch {
        setOrdersError('Failed to load orders. Please try again.')
      } finally {
        setOrdersLoading(false)
      }
    }
    load()
  }, [isOpen, editInvoice])

  // Close suggestions when clicking outside the input or the list
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputWrapRef.current && !inputWrapRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) setListOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openList = () => {
    if (inputWrapRef.current) setRect(inputWrapRef.current.getBoundingClientRect())
    setListOpen(true)
  }

  const handleQueryChange = (value: string) => {
    setItemQuery(value)
    // Editing the query deselects the order — it must be re-verified from the list
    if (selectedOrder) setSelectedOrder(null)
    if (!listOpen) openList()
  }

  const suggestions = (() => {
    const q = itemQuery.trim().toLowerCase()
    const matches = q
      ? orders.filter((o) =>
          (o.itemNumber || '').toLowerCase().includes(q) ||
          (o.itemName || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q)
        )
      : orders
    return matches.slice(0, 8)
  })()

  const handleSelect = (order: Order) => {
    setSelectedOrder(order)
    setItemQuery(order.itemNumber)
    setListOpen(false)
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setError(null)

    if (!selectedOrder) {
      setError(`Please select an existing order before ${editInvoice ? 'updating' : 'creating'} the invoice.`)
      return
    }
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.')
      return
    }
    if (editInvoice && invoiceNumber.trim() === editInvoice.invoiceNumber?.trim()) {
      setError('Enter a new invoice number to create a new invoice.')
      return
    }
    if (!bankDetails.trim()) {
      setError('Bank details are required.')
      return
    }

    setSaving(true)
    try {
      // Re-verify the order still exists and use fresh data — never trust the
      // user-editable search field or stale client state
      const orderSnap = await getDoc(doc(db, 'orders', selectedOrder.id))
      if (!orderSnap.exists()) {
        setError('The selected order could not be verified. It may have been deleted — please choose another order.')
        setSaving(false)
        return
      }
      const order = { id: orderSnap.id, ...orderSnap.data() } as Order

      // Prevent duplicate invoice numbers for used-goods invoices
      const dupSnap = await getDocs(query(
        collection(db, 'documents'),
        where('docType', '==', 'used_goods_invoice'),
        where('invoiceNumber', '==', invoiceNumber.trim())
      ))
      const duplicateExists = !dupSnap.empty
      if (duplicateExists) {
        setError(`Invoice number "${invoiceNumber.trim()}" is already in use.`)
        setSaving(false)
        return
      }

      const invoiceData = {
        docType: 'used_goods_invoice',
        category: 'used_goods',
        status: 'draft',
        invoiceNumber: invoiceNumber.trim(),
        bankDetails: bankDetails.trim(),
        orderId: order.id,
        sourceCollection: 'orders',
        itemNumber: order.itemNumber,
        itemName: order.itemName,
        price: order.price,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        postcode: order.postcode,
        deliveryDate: order.deliveryDate,
      }

      await addDoc(collection(db, 'documents'), {
        ...invoiceData,
        sourceInvoiceId: editInvoice?.id ?? null,
        createdAt: serverTimestamp(),
        createdBy: user?.uid ?? null,
        createdByName: user?.displayName ?? user?.email ?? null,
      })

      resetForm()
      onClose()
    } catch {
      setError('Failed to create the invoice. Please try again.')
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const field = (label: string, value: string, key: string) => (
    <div key={key}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="text" value={value} readOnly tabIndex={-1} className={readOnlyClass} />
    </div>
  )

  const suggestionList = listOpen && rect ? createPortal(
    <ul
      ref={listRef}
      style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }}
      className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl max-h-64 overflow-y-auto"
    >
      {ordersLoading ? (
        <li className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Loading orders…
        </li>
      ) : ordersError ? (
        <li className="px-4 py-4 text-sm text-red-400">{ordersError}</li>
      ) : suggestions.length === 0 ? (
        <li className="px-4 py-4 text-sm text-gray-500">No matching orders found.</li>
      ) : (
        suggestions.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => handleSelect(order)}
              className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-white truncate">{order.itemNumber || '(no item no.)'}</span>
                <span className="text-xs text-gray-500 truncate">{order.customerName}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">{order.itemName}</p>
            </button>
          </li>
        ))
      )}
    </ul>,
    document.body
  ) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="modal-scroll relative w-full max-w-2xl max-h-[73vh] overflow-y-auto backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300">
        <div className="flex items-center justify-between pb-4 mb-6">
          <h2 className="text-2xl font-semibold">{editInvoice ? 'Create New Invoice' : 'New Invoice'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition-colors text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Number — must resolve to an existing Used Goods order */}
          <div ref={inputWrapRef} className="relative">
            <label htmlFor="itemNumber" className="block text-sm font-medium mb-1">
              Item Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                id="itemNumber"
                name="itemNumber"
                type="text"
                value={itemQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={openList}
                autoComplete="off"
                placeholder="Search by item number, item name, or customer"
                className={`${inputClass} pl-9 pr-9`}
              />
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none transition-transform duration-200 ${listOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {suggestionList}

          {/* Order snapshot — read-only, sourced exclusively from the selected order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Item Name', selectedOrder?.itemName ?? '', 'itemName')}
            {field('Price (£)', selectedOrder?.price ?? '', 'price')}
            {field('Phone', selectedOrder?.phone ?? '', 'phone')}
            {field('Postcode', selectedOrder?.postcode ?? '', 'postcode')}
          </div>
          {field('Address', selectedOrder?.address ?? '', 'address')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('Delivery Date', selectedOrder?.deliveryDate ?? '', 'deliveryDate')}
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium mb-1">
                Invoice Number
              </label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="bankDetails" className="block text-sm font-medium mb-1">
              Bank Details
            </label>
            <textarea
              id="bankDetails"
              name="bankDetails"
              rows={4}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

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
              disabled={saving}
              className={`px-4 py-2 rounded-2xl text-sm bg-purple-600 text-white transition-colors flex items-center gap-2 ${
                saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
              }`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
