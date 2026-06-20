import { type TripRaw } from '../tripUtils'
import PhotoField from './fields/PhotoField'

type Props = {
  meta: TripRaw['meta']
  onMeta: (k: keyof TripRaw['meta'], v: string) => void
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
      <PhotoField label="Cover photo" value={meta.cover} onSet={(v) => onMeta('cover', v)} />
    </div>
  )
}
