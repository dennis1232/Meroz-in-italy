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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

function formatDates(start: string, end: string): string {
  if (start && end) {
    const sy = new Date(start).getUTCFullYear()
    const ey = new Date(end).getUTCFullYear()
    return sy === ey
      ? `${fmtDate(start)} – ${fmtDate(end)}, ${ey}`
      : `${fmtDate(start)} ${sy} – ${fmtDate(end)} ${ey}`
  }
  if (start) return fmtDate(start)
  if (end) return fmtDate(end)
  return 'Dates not set'
}

function tripDays(start: string, end: string): string {
  if (!start || !end) return ''
  const d = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
  return d > 0 ? `${d} days` : ''
}

export default function AdminTripCard({ trip: t, disabled, copiedId, onOpen, onRename, onDuplicate, onCopyLink, onDelete }: Props) {
  const days = tripDays(t.startISO, t.endISO)
  return (
    <article className="adm-trip-card">
      <button type="button" className="adm-trip-open" disabled={disabled} onClick={onOpen}>
        <div
          className="adm-trip-thumb"
          style={t.cover ? { backgroundImage: `url(${t.cover})` } : undefined}
        >
          {!t.cover && <span className="adm-trip-thumb-icon">🗺️</span>}
        </div>
        <div className="adm-trip-card-body">
          <span className="adm-trip-card-title">{t.title || t.id}</span>
          <span className="adm-trip-card-meta">
            {formatDates(t.startISO, t.endISO)}
            {days && <span className="adm-trip-card-days"> · {days}</span>}
          </span>
          <code className="adm-trip-card-id">{t.id}</code>
        </div>
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
