import { useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Trash2, Clock, CheckCircle2, Search, X } from 'lucide-react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import NewRemovalModal from './NewRemovalModal'
import RemovalViewModal from './RemovalViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'

interface RemovalOrder {
  id: string
  customerName: string
  email: string
  phone: string
  postcode: string
  address: string
  notes: string
  removalDate: string
  totalPrice: string
  advance: string
  startTime: string
  endTime: string
  paymentMethod: 'card' | 'cash' | 'both'
  status: 'pending' | 'completed'
}

export default function RemovalsOrders() {
  const [orders, setOrders] = useState<RemovalOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<RemovalOrder | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'removalOrders'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: RemovalOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RemovalOrder, 'id'>),
        }))
        setOrders(data)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching removal orders:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleView = (order: RemovalOrder) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  const handleEdit = (order: RemovalOrder) => {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  const handleDelete = (order: RemovalOrder) => {
    setSelectedOrder(order)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedOrder) {
      try {
        await deleteDoc(doc(db, 'removalOrders', selectedOrder.id))
      } catch (error) {
        console.error('Error deleting removal order:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedOrder(null)
  }

  const handleSaveOrder = async (order: RemovalOrder) => {
    const { id, ...orderData } = order
    try {
      if (orders.find((o) => o.id === id)) {
        await updateDoc(doc(db, 'removalOrders', id), orderData)
      } else {
        await addDoc(collection(db, 'removalOrders'), {
          ...orderData,
          createdAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error('Error saving removal order:', error)
    }
  }

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [dateFilter, setDateFilter] = useState('')

  // Pagination states
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const INITIAL_DISPLAY_LIMIT = 5

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query) ||
          order.postcode.toLowerCase().includes(query) ||
          order.address.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Date filter
    if (dateFilter) {
      result = result.filter((order) => order.removalDate === dateFilter)
    }

    return result
  }, [orders, searchQuery, statusFilter, dateFilter])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('')
  }

  // Calculate displayed orders based on showAll and pagination
  const displayedOrders = useMemo(() => {
    if (!showAll) {
      return filteredOrders.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, showAll, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  }, [filteredOrders.length])

  return (
    <section className="flex-1 p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Removals</p>
          <h1 className="text-3xl font-semibold leading-tight">Orders</h1>
        </header>
        <button
          type="button"
          className="btn border"
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Removal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Pending Removals</p>
            <p className="text-2xl font-semibold">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Completed Removals</p>
            <p className="text-2xl font-semibold">{orders.filter(o => o.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, postcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-1 rounded-full hover:bg-gray-100"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Clear Filters */}
        {(searchQuery || statusFilter !== 'all' || dateFilter) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading orders...</p>}

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {!showAll && filteredOrders.length > INITIAL_DISPLAY_LIMIT
          ? `Showing ${Math.min(INITIAL_DISPLAY_LIMIT, filteredOrders.length)} of ${filteredOrders.length} orders`
          : `Showing ${filteredOrders.length} of ${orders.length} orders`}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-sm">
            {orders.length === 0
              ? 'No orders yet. Start by creating a new removal order.'
              : 'No orders match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Customer Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Phone Number</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Postcode</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-sm">{order.customerName}</td>
                    <td className="px-4 py-3 text-sm">{order.phone}</td>
                    <td className="px-4 py-3 text-sm">{order.postcode}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.removalDate}</td>
                    <td className="px-4 py-3 text-sm">£{order.totalPrice}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1.5 rounded transition-colors"
                          title="View"
                          onClick={() => handleView(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded transition-colors"
                          title="Edit"
                          onClick={() => handleEdit(order)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded transition-colors"
                          title="Delete"
                          onClick={() => handleDelete(order)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show All / Show Less Button */}
      {!showAll && filteredOrders.length > INITIAL_DISPLAY_LIMIT && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(true)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Show All ({filteredOrders.length} orders)
          </button>
        </div>
      )}

      {showAll && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(false)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Show Less (Last {Math.min(INITIAL_DISPLAY_LIMIT, filteredOrders.length)})
          </button>
        </div>
      )}

      {/* Pagination - only show when showing all and there are multiple pages */}
      {showAll && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      <NewRemovalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveOrder}
      />

      {/* View Modal */}
      <RemovalViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
      />

      {/* Edit Modal */}
      <NewRemovalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedOrder(null)
        }}
        onSave={handleSaveOrder}
        editRemoval={selectedOrder ? (({ id: _id, ...rest }) => rest)(selectedOrder) : null}
        editId={selectedOrder?.id ?? null}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedOrder(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Removal Order"
        itemName={selectedOrder?.customerName}
      />
    </section>
  )
}
