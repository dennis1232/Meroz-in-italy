import type { MouseEvent } from 'react'
import type { TripEntry } from './useAdminModals'

type Props = {
  trip: TripEntry
  disabled: boolean
  copiedId: string | null
  onOpen: () => void
  onRename: (e: MouseEvent) => void
  onDuplicate: (e: MouseEvent) => void
  onCopyLink: (e: MouseEvent) => void
  onDelete: (e: MouseEvent) => void
}

function formatDates(start: string, end: string): string {
  if (start && end) return `${start} → ${end}`
  if (start || end) return start || end
  return 'Dates not set'
}

export default function AdminTripCard({ trip: t, disabled, copiedId, onOpen, onRename, onDuplicate, onCopyLink, onDelete }: Props) {
  return (
    <article className="adm-trip-card">
      <button type="button" className="adm-trip-open" disabled={disabled} onClick={onOpen}>
        <span className="adm-trip-card-title">{t.title || t.id}</span>
        <span className="adm-trip-card-meta">{formatDates(t.startISO, t.endISO)}</span>
        <code className="adm-trip-card-id">{t.id}</code>
      </button>
      <div className="adm-trip-toolbar" onClick={e => e.stopPropagation()}>
        <button type="button" className="adm-tool" title="Rename" onClick={onRename} disabled={disabled}>
          <span className="adm-tool-icon">✎</span>
          <span className="adm-tool-label">Rename</span>
        </button>
        <button type="button" className="adm-tool" title="Duplicate" onClick={onDuplicate} disabled={disabled}>
          <span className="adm-tool-icon">⎘</span>
          <span className="adm-tool-label">Duplicate</span>
        </button>
        <button type="button" className="adm-tool" title="Copy public link" onClick={onCopyLink}>
          <span className="adm-tool-icon">{copiedId === t.id ? '✓' : '🔗'}</span>
          <span className="adm-tool-label">{copiedId === t.id ? 'Copied' : 'Link'}</span>
        </button>
        <button type="button" className="adm-tool adm-tool-danger" title="Delete" onClick={onDelete} disabled={disabled}>
          <span className="adm-tool-icon">⌫</span>
          <span className="adm-tool-label">Delete</span>
        </button>
      </div>
    </article>
  )
}
