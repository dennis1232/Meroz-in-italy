import { useState } from 'react'
import { isoToFields, toClean, toRaw, type DayRaw, type TripRaw } from '../tripUtils'
import AdminModal, { ModalActions, ModalField } from './AdminModal'
import type { TripEntry } from './useAdminModals'

const ID_RE = /^[a-z0-9-]+$/

function toSlug(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeDays(startISO: string, endISO: string): DayRaw[] {
  const days: DayRaw[] = []
  const cur = new Date(startISO + 'T00:00:00')
  const end = new Date(endISO + 'T00:00:00')
  let n = 1
  while (cur <= end && n <= 30) {
    const iso = localISO(cur)
    const f = isoToFields(iso)
    days.push({ n, iso, date: f.date, dow: f.dow, en: f.en, hero: '', title: '', intro: '', stops: [] })
    cur.setDate(cur.getDate() + 1)
    n++
  }
  return days
}

function dayCount(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0
  return Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 86400000) + 1
}

type Props = { open: boolean; trips: TripEntry[]; onClose: () => void }

export default function AdminTripWizard({ open, trips, onClose }: Props) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const [lang, setLang] = useState<'he' | 'en'>('he')
  const [who, setWho] = useState('')
  const [startISO, setStartISO] = useState('')
  const [endISO, setEndISO] = useState('')
  const [err, setErr] = useState('')

  const reset = () => { setStep(1); setName(''); setId(''); setLang('he'); setWho(''); setStartISO(''); setEndISO(''); setErr('') }
  const close = () => { reset(); onClose() }

  const days = dayCount(startISO, endISO)

  const next = () => {
    setErr('')
    if (step === 1) {
      const slug = id.trim()
      if (!name.trim()) { setErr('Enter a trip name.'); return }
      if (!slug || !ID_RE.test(slug)) { setErr('ID must use lowercase letters, numbers, and hyphens.'); return }
      if (trips.find(t => t.id === slug)) { setErr('A trip with this ID already exists.'); return }
    }
    if (step === 2) {
      if (!startISO || !endISO) { setErr('Set both start and end dates.'); return }
      if (new Date(endISO) < new Date(startISO)) { setErr('End date must be after start date.'); return }
      if (days > 30) { setErr('Maximum 30 days per trip.'); return }
    }
    setStep(s => s + 1)
  }

  const create = () => {
    const tripId = id.trim()
    const generatedDays = startISO && endISO ? makeDays(startISO, endISO) : []
    const tripData: TripRaw = {
      meta: { title: name.trim(), subtitle: '', startISO, endISO, who, cover: '', lang },
      contact: { instagram: '', phoneIL: '', phoneILraw: '', phoneIT: '', phoneITraw: '' },
      days: generatedDays,
      attractions: [],
      places: [],
    }
    const raw = toRaw(tripData)
    localStorage.setItem(`draft-${tripId}`, JSON.stringify(raw))
    localStorage.setItem(`preview-${tripId}`, JSON.stringify(toClean(raw)))
    location.href = `/admin/${tripId}`
  }

  const stepTitle = step === 1 ? 'New trip — Identity' : step === 2 ? 'New trip — Dates' : 'New trip — Confirm'

  return (
    <AdminModal open={open} title={stepTitle} onClose={close} width={520}
      footer={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
          <div className="adm-wiz-steps">
            {[1, 2, 3].map(s => <span key={s} className={`adm-wiz-dot${step === s ? ' adm-wiz-dot-active' : step > s ? ' adm-wiz-dot-done' : ''}`} />)}
          </div>
          <div style={{ flex: 1 }} />
          {step > 1 && <button type="button" className="adm-modal-btn" onClick={() => { setErr(''); setStep(s => s - 1) }}>← Back</button>}
          {step < 3
            ? <ModalActions onCancel={close} submitLabel="Next →" onSubmit={next} />
            : <ModalActions onCancel={close} submitLabel="✨ Create trip" onSubmit={create} />}
        </div>
      }
    >
      {step === 1 && (
        <>
          <ModalField label="Trip name" hint="Shown to travelers, e.g. Cohen Italy 2026" error={err && err.includes('name') ? err : undefined}>
            <input
              value={name}
              autoFocus
              placeholder="Cohen Italy 2026"
              onChange={e => { setName(e.target.value); setId(toSlug(e.target.value)) }}
            />
          </ModalField>
          <ModalField label="Trip ID (URL slug)" hint="Auto-generated from name — used in the URL" error={err && !err.includes('name') ? err : undefined}>
            <input
              value={id}
              placeholder="cohen-italy-2026"
              onChange={e => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
          </ModalField>
          <ModalField label="App language">
            <select value={lang} onChange={e => setLang(e.target.value as 'he' | 'en')}>
              <option value="he">🇮🇱 Hebrew (עברית)</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </ModalField>
        </>
      )}

      {step === 2 && (
        <>
          <div className="adm-row2" style={{ marginBottom: 14 }}>
            <ModalField label="Start date">
              <input type="date" value={startISO} onChange={e => setStartISO(e.target.value)} />
            </ModalField>
            <ModalField label="End date">
              <input type="date" value={endISO} onChange={e => setEndISO(e.target.value)} />
            </ModalField>
          </div>
          {days > 0 && (
            <div className="adm-wiz-daybadge">⚡ {days} day{days !== 1 ? 's' : ''} will be created automatically</div>
          )}
          <ModalField label="Travellers (optional)" hint="e.g. The Cohen Family">
            <input value={who} placeholder="The Cohen Family" onChange={e => setWho(e.target.value)} />
          </ModalField>
          {err && <p className="adm-modal-error" style={{ marginTop: 8 }}>{err}</p>}
        </>
      )}

      {step === 3 && (
        <div className="adm-wiz-summary">
          <div className="adm-wiz-summary-row"><span>Name</span><strong>{name}</strong></div>
          <div className="adm-wiz-summary-row"><span>ID</span><code>{id}</code></div>
          <div className="adm-wiz-summary-row"><span>Language</span><strong>{lang === 'he' ? '🇮🇱 Hebrew' : '🇬🇧 English'}</strong></div>
          {startISO && <div className="adm-wiz-summary-row"><span>Start</span><strong>{startISO}</strong></div>}
          {endISO && <div className="adm-wiz-summary-row"><span>End</span><strong>{endISO}</strong></div>}
          {days > 0 && <div className="adm-wiz-summary-row"><span>Days</span><strong>{days} day stubs ready</strong></div>}
          {who && <div className="adm-wiz-summary-row"><span>Travellers</span><strong>{who}</strong></div>}
          <p className="adm-modal-note" style={{ marginTop: 16 }}>
            The trip will open in the editor with all day stubs pre-filled. Add photos, stops, and details there.
          </p>
        </div>
      )}
    </AdminModal>
  )
}
