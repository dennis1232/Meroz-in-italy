import { A, ddmm } from '../types'
import { logo } from '../ui'
import { type TripRaw } from '../tripUtils'
import { getCloudConfig, uploadImage } from '../cloud'
import { fileToDataUrl } from './utils'
import { useState } from 'react'

type Props = {
  meta: TripRaw['meta']
  onMeta: (k: keyof TripRaw['meta'], v: string) => void
}

function CoverPreview({ meta, onReplace }: { meta: TripRaw['meta']; onReplace: (v: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [dragging, setDragging] = useState(false)

  const upload = async (file: File) => {
    setBusy(true)
    setErr('')
    try {
      onReplace(getCloudConfig() ? await uploadImage(file) : await fileToDataUrl(file))
    } catch (ex) {
      setErr(String(ex))
    } finally {
      setBusy(false)
    }
  }

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await upload(file)
    e.target.value = ''
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) await upload(file)
  }

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  const dateStr = meta.startISO && meta.endISO
    ? `${ddmm(meta.startISO)} – ${ddmm(meta.endISO)}`
    : 'dd/mm – dd/mm'

  return (
    <div
      className={`adm-photo adm-cover-preview-wrap${dragging ? ' adm-photo-drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="adm-photo-top">
        <span>Cover photo</span>
        <label className="adm-photo-btn">
          {busy ? '⏳…' : meta.cover ? '🔄 Replace' : '📷 Upload'}
          <input type="file" accept="image/*" onChange={pick} hidden />
        </label>
      </div>
      {err && <p className="adm-error">{err}</p>}
      <div
        className="adm-cover-preview"
        style={meta.cover ? { backgroundImage: `url(${A(meta.cover)})` } : undefined}
      >
        <div className="adm-cover-preview-overlay" />
        <div className="adm-cover-preview-content">
          <img className="adm-cover-preview-logo" src={logo} alt="" />
          <div className="adm-cover-preview-dates" dir="ltr">{dateStr}</div>
          {meta.who && <div className="adm-cover-preview-who">{meta.who}</div>}
        </div>
      </div>
    </div>
  )
}

export default function AdminCoverSection({ meta, onMeta }: Props) {
  return (
    <div id="adm-cover" className="adm-section">
      <h2>Trip cover & details</h2>
      <div className="adm-cover-layout">
        <div className="adm-cover-fields">
          <div className="adm-row2">
            <label>📅 Start date<input type="date" value={meta.startISO} onChange={(e) => onMeta('startISO', e.target.value)} /></label>
            <label>📅 End date<input type="date" value={meta.endISO} onChange={(e) => onMeta('endISO', e.target.value)} /></label>
            <label>Travellers line<input value={meta.who} onChange={(e) => onMeta('who', e.target.value)} /></label>
            <label>App language
              <select value={meta.lang ?? 'he'} onChange={(e) => onMeta('lang', e.target.value)}>
                <option value="he">🇮🇱 Hebrew (עברית)</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </label>
          </div>
        </div>
        <CoverPreview meta={meta} onReplace={(v) => onMeta('cover', v)} />
      </div>
    </div>
  )
}
