import { ReactElement } from 'react'
import { usePDF } from '@react-pdf/renderer'
import { Loader2, X } from 'lucide-react'

function PreviewBody({ document, title }: { document: ReactElement; title: string }) {
  const [instance] = usePDF({ document })
  if (instance.loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
  if (instance.error || !instance.url) return <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-400">Failed to load the document preview.</div>
  return <iframe src={`${instance.url}#toolbar=0&navpanes=0`} title={title} className="h-full w-full rounded-xl border-0" />
}

export default function DocumentPdfPreview({ document, title, heading, onClose }: {
  document: ReactElement | null
  title: string
  heading: string
  onClose: () => void
}) {
  if (!document) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{heading}</p><h2 className="text-lg font-semibold text-white">{title}</h2></div>
          <button type="button" onClick={onClose} className="rounded-2xl p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white" title="Close preview" aria-label="Close preview"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 bg-black/40 p-2 sm:p-4"><PreviewBody document={document} title={title} /></div>
      </div>
    </div>
  )
}
