import { A, ddmm } from '../data'
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

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      onReplace(getCloudConfig() ? await uploadImage(file) : await fileToDataUrl(file))
    } catch (ex) {
      setErr(String(ex))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const dateStr = meta.startISO && meta.endISO
    ? `${ddmm(meta.startISO)} – ${ddmm(meta.endISO)}`
    : 'dd/mm – dd/mm'

  return (
    <div className="adm-cover-preview-wrap">
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
        <label className="adm-cover-preview-btn">
          {busy ? '⏳…' : meta.cover ? '🔄 Replace photo' : '📷 Upload photo'}
          <input type="file" accept="image/*" onChange={pick} hidden />
        </label>
      </div>
      {err && <div style={{ color: 'red', fontSize: 12, marginTop: 6 }}>{err}</div>}
    </div>
  )
}

export default function AdminCoverSection({ meta, onMeta }: Props) {
  return (
    <div id="adm-cover" className="adm-section">
      <h2>Trip cover & details</h2>
      <div className="adm-row3">
        <label>Title<input value={meta.title} onChange={(e) => onMeta('title', e.target.value)} /></label>
        <label>Subtitle<input value={meta.subtitle} onChange={(e) => onMeta('subtitle', e.target.value)} /></label>
        <label>Country<input value={meta.country} onChange={(e) => onMeta('country', e.target.value)} /></label>
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
      <CoverPreview meta={meta} onReplace={(v) => onMeta('cover', v)} />
    </div>
  )
}
