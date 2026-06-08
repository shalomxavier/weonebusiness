import { useState, useEffect } from 'react'
import { X, Paperclip, CalendarDays } from 'lucide-react'
import { Enquiry, StatusStage } from './NewEnquiryModal'

const STATUS_LABELS: Record<string, string> = {
  'no-answer': 'No Answer',
  'answered': 'Answered',
  'very-interested': 'Very Interested',
  'looking-for-quotes': 'Looking for Quotes',
  'got-booked': 'Got Booked',
  'completed-without-booking': 'Completed Without Booking',
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  'removal': 'Removal',
  'clearance': 'Clearance',
}

const STATUS_COLORS: Record<string, string> = {
  'no-answer': 'text-gray-400 bg-gray-400/10',
  'answered': 'text-blue-400 bg-blue-400/10',
  'very-interested': 'text-green-400 bg-green-400/10',
  'looking-for-quotes': 'text-yellow-400 bg-yellow-400/10',
  'got-booked': 'text-purple-400 bg-purple-400/10',
  'completed-without-booking': 'text-orange-400 bg-orange-400/10',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  enquiry: Enquiry | null
}

export default function EnquiryViewModal({ isOpen, onClose, enquiry }: Props) {
  const [fileUrls, setFileUrls] = useState<string[]>([])

  useEffect(() => {
    setFileUrls(enquiry?.fileUrls ?? [])
  }, [enquiry])

  if (!isOpen || !enquiry) return null

  const fmt = (iso: string) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
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
          <Row label="Service Type" value={SERVICE_TYPE_LABELS[enquiry.serviceType] || 'Removal'} />

          {/* Status Stages Timeline */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Status Timeline</p>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/30 to-transparent" />
              
              <div className="space-y-4">
                {(enquiry.statusStages || [{ status: enquiry.status, notes: enquiry.notes, date: enquiry.callBackDate }]).map((stage: StatusStage, index: number) => (
                  <div key={index} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === (enquiry.statusStages?.length || 1) - 1 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Stage card */}
                    <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[stage.status]}`}>
                          {STATUS_LABELS[stage.status]}
                        </span>
                        {stage.date && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarDays className="w-3 h-3" />
                            {fmt(stage.date)}
                          </span>
                        )}
                      </div>
                      {stage.notes && (
                        <p className="text-sm text-gray-300 leading-relaxed">{stage.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <Row label="Call Back Date" value={fmt(enquiry.callBackDate)} />
          <Row label="General Notes" value={enquiry.notes || '—'} />
          <Row label="Attachments" value={
            fileUrls.length > 0 ? (
              <div className="flex flex-col gap-2 mt-1">
                {fileUrls.map((url, i) => {
                  const name = decodeURIComponent(url.split('%2F').pop()?.split('?')[0] ?? `File ${i + 1}`)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors flex-1 min-w-0"
                      >
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{name}</span>
                      </a>
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
