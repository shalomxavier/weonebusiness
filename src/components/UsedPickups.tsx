import { useMemo, useState } from 'react'
import { Eye, Pencil, Trash2, Clock, CheckCircle2, XCircle, Search, X } from 'lucide-react'
import NewPickupModal from './NewPickupModal'
import PickupViewModal from './PickupViewModal'
import DeleteConfirmModal from './DeleteConfirmModal'

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

export default function UsedPickups() {
  const [pickups, setPickups] = useState<Pickup[]>([
    {
      id: '1',
      pickupNumber: 'PKP-001',
      itemName: 'Vintage Wardrobe',
      price: '350',
      advance: '50',
      customerName: 'Alice Brown',
      phone: '555-1001',
      address: '10 Elm Street',
      postcode: 'AB1 2CD',
      pickupDate: '2026-04-28',
      pickupStartTime: '09:00',
      pickupEndTime: '11:00',
      additionalNotes: 'Large item, bring extra help',
      status: 'pending',
    },
    {
      id: '2',
      pickupNumber: 'PKP-002',
      itemName: 'Oak Bookshelf',
      price: '120',
      advance: '',
      customerName: 'Bob Carter',
      phone: '555-2002',
      address: '22 Maple Ave',
      postcode: 'EF3 4GH',
      pickupDate: '2026-04-29',
      pickupStartTime: '13:00',
      pickupEndTime: '14:00',
      additionalNotes: '',
      status: 'collected',
    },
  ])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'collected' | 'cancelled'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy] = useState<'pickupDate' | 'customerName' | 'itemName' | 'price'>('pickupDate')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')

  // Pagination states
  const [showAll, setShowAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const INITIAL_DISPLAY_LIMIT = 5

  const filteredPickups = useMemo(() => {
    let result = [...pickups]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.customerName.toLowerCase().includes(query) ||
          p.itemName.toLowerCase().includes(query) ||
          p.pickupNumber.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.phone.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (dateFilter) {
      result = result.filter((p) => p.pickupDate === dateFilter)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'pickupDate':
          comparison = new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
          break
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName)
          break
        case 'itemName':
          comparison = a.itemName.localeCompare(b.itemName)
          break
        case 'price':
          comparison = parseFloat(a.price) - parseFloat(b.price)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [pickups, searchQuery, statusFilter, dateFilter, sortBy, sortOrder])

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('')
    setSortBy('pickupDate')
  }

  // Calculate displayed pickups based on showAll and pagination
  const displayedPickups = useMemo(() => {
    if (!showAll) {
      return filteredPickups.slice(0, INITIAL_DISPLAY_LIMIT)
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPickups.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredPickups, showAll, currentPage])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPickups.length / ITEMS_PER_PAGE)
  }, [filteredPickups.length])

  const handleView = (pickup: Pickup) => {
    setSelectedPickup(pickup)
    setIsViewModalOpen(true)
  }

  const handleEdit = (pickup: Pickup) => {
    setSelectedPickup(pickup)
    setIsEditModalOpen(true)
  }

  const handleDelete = (pickup: Pickup) => {
    setSelectedPickup(pickup)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (selectedPickup) {
      setPickups(pickups.filter((p) => p.id !== selectedPickup.id))
    }
    setIsDeleteModalOpen(false)
    setSelectedPickup(null)
  }

  const handleSavePickup = (pickup: Pickup) => {
    const existingIndex = pickups.findIndex((p) => p.id === pickup.id)
    if (existingIndex >= 0) {
      const updated = [...pickups]
      updated[existingIndex] = pickup
      setPickups(updated)
    } else {
      setPickups([...pickups, pickup])
    }
  }

  const statusBadge = (status: Pickup['status']) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (status === 'collected') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <section className="flex-1 p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Used Goods</p>
          <h1 className="text-3xl font-semibold leading-tight">Pickups</h1>
        </header>
        <button type="button" className="btn border" onClick={() => setIsCreateModalOpen(true)}>
          New Pickup
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-semibold">{pickups.filter((p) => p.status === 'pending').length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Collected</p>
            <p className="text-2xl font-semibold">{pickups.filter((p) => p.status === 'collected').length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Cancelled</p>
            <p className="text-2xl font-semibold">{pickups.filter((p) => p.status === 'cancelled').length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, item, address..."
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

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

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

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <option value="pickupDate">Pickup Date</option>
            <option value="customerName">Customer Name</option>
            <option value="itemName">Item Name</option>
            <option value="price">Price</option>
          </select>
        </div>

        {(searchQuery || statusFilter !== 'all' || dateFilter || sortBy !== 'pickupDate') && (
          <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="text-sm text-gray-500">
        {!showAll && filteredPickups.length > INITIAL_DISPLAY_LIMIT
          ? `Showing ${Math.min(INITIAL_DISPLAY_LIMIT, filteredPickups.length)} of ${filteredPickups.length} pickups`
          : `Showing ${filteredPickups.length} of ${pickups.length} pickups`}
      </div>

      {filteredPickups.length === 0 ? (
        <div className="border rounded-lg p-6">
          <p className="text-sm">
            {pickups.length === 0
              ? 'No pickups yet. Start by creating a new pickup.'
              : 'No pickups match your filters. Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Product Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Customer Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedPickups.map((pickup) => (
                  <tr key={pickup.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-sm">{pickup.itemName}</td>
                    <td className="px-4 py-3 text-sm">{pickup.customerName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(pickup.status)}`}>
                        {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{pickup.pickupDate}</td>
                    <td className="px-4 py-3 text-sm">${pickup.price}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(pickup)}
                          className="p-1.5 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(pickup)}
                          className="p-1.5 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pickup)}
                          className="p-1.5 rounded transition-colors"
                          title="Delete"
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
      {!showAll && filteredPickups.length > INITIAL_DISPLAY_LIMIT && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setShowAll(true)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Show All ({filteredPickups.length} pickups)
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
            Show Less (Last {Math.min(INITIAL_DISPLAY_LIMIT, filteredPickups.length)})
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

      <NewPickupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSavePickup}
      />

      <NewPickupModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPickup(null)
        }}
        editPickup={selectedPickup}
        onSave={handleSavePickup}
      />

      <PickupViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedPickup(null)
        }}
        pickup={selectedPickup}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedPickup(null)
        }}
        onConfirm={confirmDelete}
        orderName={selectedPickup?.customerName || ''}
      />
    </section>
  )
}
