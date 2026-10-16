import { useState } from 'react'
import NewDocumentModal, { DOCUMENT_LABELS, DocumentType } from './NewDocumentModal'

interface DocumentsPageProps {
  docType: DocumentType
}

export default function DocumentsPage({ docType }: DocumentsPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const label = DOCUMENT_LABELS[docType]

  return (
    <section className="flex-1 p-8 pt-20 space-y-6 text-gray-300">
      <div className="flex flex-wrap items-center justify-between gap-4 animate-stack-up">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest">Documents</p>
          <h1 className="text-4xl font-semibold leading-tight">{label}s</h1>
        </header>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl text-gray-300 text-base font-medium hover:bg-white/10 transition-colors border border-white/10"
          >
            New {label}
          </button>
        </div>
      </div>
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center animate-stack-up delay-100">
        <p className="text-gray-400">This section is coming soon.</p>
      </div>
      <NewDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        docType={docType}
      />
    </section>
  )
}
