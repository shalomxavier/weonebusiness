import { useState, useEffect } from 'react'
import { X, Paperclip, Trash2, Loader2 } from 'lucide-react'
import { ref, deleteObject } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { db, storage } from '../lib/firebase'
import { Enquiry } from './NewEnquiryModal'

const STATUS_LABELS: Record<string, string> = {
  'no-answer': 'No Answer',
  'answered': 'Answered',
  'very-interested': 'Very Interested',
  'looking-for-quotes': 'Looking for Quotes',
  'completed': 'Completed',
}

const STATUS_COLORS: Record<string, string> = {
  'no-answer': 'text-gray-400 bg-gray-400/10',
  'answered': 'text-blue-400 bg-blue-400/10',
  'very-interested': 'text-green-400 bg-green-400/10',
  'looking-for-quotes': 'text-yellow-400 bg-yellow-400/10',
  'completed': 'text-purple-400 bg-purple-400/10',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  enquiry: Enquiry | null
}

export default function EnquiryViewModal({ isOpen, onClose, enquiry }: Props) {
  const [fileUrls, setFileUrls] = useState<string[]>([])
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  useEffect(() => {
    setFileUrls(enquiry?.fileUrls ?? [])
  }, [enquiry])

  if (!isOpen || !enquiry) return null

  const fmt = (iso: string) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }

  const handleDeleteFile = async (url: string, index: number) => {
    setDeletingIndex(index)
    try {
      const storageRef = ref(storage, url)
      await deleteObject(storageRef)
      const updated = fileUrls.filter((_, i) => i !== index)
      await updateDoc(doc(db, 'leads', enquiry.id), { fileUrls: updated })
      setFileUrls(updated)
    } catch (err) {
      console.error('Failed to delete file', err)
    } finally {
      setDeletingIndex(null)
    }
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</p>
      <div className="text-base text-gray-200">{value}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-gray-300 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Enquiry Details</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-2xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <Row label="Name" value={enquiry.name} />
          <Row label="Contact Number" value={enquiry.contactNumber} />
          <Row label="Status" value={
            <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-medium ${STATUS_COLORS[enquiry.status]}`}>
              {STATUS_LABELS[enquiry.status]}
            </span>
          } />
          <Row label="Call Back Date" value={fmt(enquiry.callBackDate)} />
          <Row label="Notes" value={enquiry.notes || '—'} />
          <Row label="Attachments" value={
            fileUrls.length > 0 ? (
              <div className="flex flex-col gap-2 mt-1">
                {fileUrls.map((url, i) => {
                  const name = decodeURIComponent(url.split('%2F').pop()?.split('?')[0] ?? `File ${i + 1}`)
                  const isDeleting = deletingIndex === i
                  return (
                    <div key={i} className="flex items-center gap-2 group">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors flex-1 min-w-0"
                      >
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{name}</span>
                      </a>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDeleteFile(url, i)}
                        className="flex-shrink-0 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        title="Delete file"
                      >
                        {isDeleting
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : '—'
          } />
        </div>
      </div>
    </div>
  )
}
