import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function AdminModal({ open, title, onClose, children, footer, width = 440 }: Props) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const first = panel.current?.querySelector<HTMLElement>('input,button,select,textarea')
    first?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="adm-modal-root" role="presentation">
      <div className="adm-modal-backdrop" onClick={onClose} />
      <div className="adm-modal" ref={panel} role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" style={{ width }}>
        <div className="adm-modal-hd">
          <h2 id="adm-modal-title">{title}</h2>
          <button type="button" className="adm-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-ft">{footer}</div>}
      </div>
    </div>
  )
}

export function ModalField({
  label, hint, error, children
}: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="adm-modal-field">
      <span className="adm-modal-label">{label}</span>
      {children}
      {hint && !error && <span className="adm-modal-hint">{hint}</span>}
      {error && <span className="adm-modal-error">{error}</span>}
    </label>
  )
}

export function ModalActions({
  onCancel, cancelLabel = 'Cancel', submitLabel, onSubmit, danger, loading, disabled
}: {
  onCancel: () => void
  cancelLabel?: string
  submitLabel: string
  onSubmit: () => void
  danger?: boolean
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <>
      <button type="button" className="adm-modal-btn" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
      <button
        type="button"
        className={`adm-modal-btn ${danger ? 'adm-modal-danger' : 'adm-modal-primary'}`}
        onClick={onSubmit}
        disabled={loading || disabled}
      >
        {loading ? 'Please wait…' : submitLabel}
      </button>
    </>
  )
}
