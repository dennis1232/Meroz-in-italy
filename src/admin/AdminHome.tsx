import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { manageTrip } from '../cloud'
import { copyTripLink } from '../ui'
import { toClean, toRaw } from '../tripUtils'
import AdminModal, { ModalActions, ModalField } from './AdminModal'

type TripEntry = { id: string; title: string; startISO: string; endISO: string }

type ModalState =
  | { kind: 'none' }
  | { kind: 'new' }
  | { kind: 'rename'; trip: TripEntry }
  | { kind: 'duplicate'; trip: TripEntry }
  | { kind: 'delete'; trip: TripEntry }

const ID_RE = /^[a-z0-9-]+$/

async function loadSourceTripJson(tripId: string): Promise<unknown | undefined> {
  const draft = localStorage.getItem(`draft-${tripId}`)
  if (draft) {
    try {
      return toClean(JSON.parse(draft))
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}trips/${tripId}.json`, { cache: 'no-cache' })
    if (res.ok) return await res.json()
  } catch { /* ignore */ }
  return undefined
}

function seedTripDraft(tripId: string, tripData: unknown) {
  const raw = toRaw(tripData)
  localStorage.setItem(`draft-${tripId}`, JSON.stringify(raw))
  localStorage.setItem(`preview-${tripId}`, JSON.stringify(toClean(raw)))
}

function formatDates(start: string, end: string) {
  if (start && end) return `${start} → ${end}`
  if (start || end) return start || end
  return 'Dates not set'
}

export default function AdminHome() {
  const [trips, setTrips] = useState<TripEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [modalBusy, setModalBusy] = useState(false)
  const [fieldErr, setFieldErr] = useState<string | null>(null)

  // form fields
  const [newId, setNewId] = useState('')
  const [renameTitle, setRenameTitle] = useState('')
  const [dupId, setDupId] = useState('')
  const [dupTitle, setDupTitle] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q
    ? trips.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    : trips

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/list-trips', { cache: 'no-cache' })
      if (res.ok) {
        setTrips(await res.json())
        return
      }
    } catch { /* local dev without functions */ }
    const res = await fetch(`${import.meta.env.BASE_URL}trips/index.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(res.status.toString())
    setTrips(await res.json())
  }, [])

  useEffect(() => {
    reload().catch(e => setError(`Could not load trips/index.json: ${e.message}`))
  }, [reload])

  const closeModal = () => {
    if (modalBusy) return
    setModal({ kind: 'none' })
    setFieldErr(null)
  }

  const openNew = () => {
    setNewId('')
    setFieldErr(null)
    setModal({ kind: 'new' })
  }

  const openRename = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    setRenameTitle(trip.title)
    setFieldErr(null)
    setModal({ kind: 'rename', trip })
  }

  const openDuplicate = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    setDupId(`${trip.id}-copy`)
    setDupTitle(`${trip.title} (copy)`)
    setFieldErr(null)
    setModal({ kind: 'duplicate', trip })
  }

  const openDelete = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    setFieldErr(null)
    setModal({ kind: 'delete', trip })
  }

  const copyLink = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    copyTripLink(trip.id).then(() => {
      setCopiedId(trip.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const submitNew = (e?: FormEvent) => {
    e?.preventDefault()
    const id = newId.trim()
    if (!ID_RE.test(id)) {
      setFieldErr('Use lowercase letters, numbers, and hyphens only.')
      return
    }
    if (trips.find(t => t.id === id)) {
      setFieldErr('A trip with this ID already exists.')
      return
    }
    location.href = `/admin/${id}`
  }

  const submitRename = async () => {
    if (modal.kind !== 'rename') return
    const title = renameTitle.trim()
    if (!title) { setFieldErr('Enter a trip name.'); return }
    if (title === modal.trip.title) { closeModal(); return }

    setModalBusy(true)
    setFieldErr(null)
    try {
      await manageTrip({ action: 'rename', tripId: modal.trip.id, title })
      const draft = localStorage.getItem(`draft-${modal.trip.id}`)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          parsed.meta ??= {}
          parsed.meta.title = title
          localStorage.setItem(`draft-${modal.trip.id}`, JSON.stringify(parsed))
        } catch { /* ignore */ }
      }
      await reload()
      closeModal()
    } catch (err) {
      setFieldErr(String(err))
    } finally {
      setModalBusy(false)
    }
  }

  const submitDuplicate = async () => {
    if (modal.kind !== 'duplicate') return
    const newTripId = dupId.trim()
    const title = dupTitle.trim()
    if (!ID_RE.test(newTripId)) {
      setFieldErr('Trip ID must use lowercase letters, numbers, and hyphens only.')
      return
    }
    if (!title) { setFieldErr('Enter a name for the copy.'); return }
    if (trips.find(t => t.id === newTripId)) {
      setFieldErr('A trip with this ID already exists.')
      return
    }

    setModalBusy(true)
    setFieldErr(null)
    try {
      const tripData = await loadSourceTripJson(modal.trip.id)
      const result = await manageTrip({
        action: 'duplicate',
        tripId: modal.trip.id,
        newTripId,
        title,
        tripData,
      })
      if (result.tripData) {
        seedTripDraft(newTripId, result.tripData)
      }
      location.href = `/admin/${newTripId}`
    } catch (err) {
      setFieldErr(String(err))
      setModalBusy(false)
    }
  }

  const submitDelete = async () => {
    if (modal.kind !== 'delete') return
    setModalBusy(true)
    setFieldErr(null)
    try {
      await manageTrip({ action: 'delete', tripId: modal.trip.id })
      localStorage.removeItem(`draft-${modal.trip.id}`)
      localStorage.removeItem(`preview-${modal.trip.id}`)
      await reload()
      closeModal()
    } catch (err) {
      setFieldErr(String(err))
    } finally {
      setModalBusy(false)
    }
  }

  return (
    <div className="adm-root adm-home" dir="ltr">
      <div className="adm-topbar">
        <h1>Trips</h1>
        <div className="adm-actions">
          <button type="button" className="adm-btn adm-btn-accent" onClick={openNew}>+ New trip</button>
        </div>
      </div>

      <div className="adm-home-body">
        {error && <div className="adm-banner adm-banner-err">{error}</div>}

        {!error && trips.length > 0 && (
          <div className="adm-home-toolbar">
            <label className="adm-trip-search">
              <span className="adm-trip-search-label">Search</span>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Name or trip ID…"
              />
            </label>
            <span className="adm-trip-count">{filtered.length} trip{filtered.length === 1 ? '' : 's'}</span>
          </div>
        )}

        {!error && trips.length === 0 && (
          <div className="adm-empty">
            <p>No trips yet</p>
            <button type="button" className="adm-modal-btn adm-modal-primary adm-empty-btn" onClick={openNew}>
              Create your first trip
            </button>
          </div>
        )}

        {!error && trips.length > 0 && filtered.length === 0 && (
          <div className="adm-empty"><p>No trips match “{query.trim()}”.</p></div>
        )}

        <div className="adm-trip-list">
          {filtered.map(t => (
            <article
              key={t.id}
              className="adm-trip-card"
            >
              <button
                type="button"
                className="adm-trip-open"
                disabled={modalBusy}
                onClick={() => location.href = `/admin/${t.id}`}
              >
                <span className="adm-trip-card-title">{t.title || t.id}</span>
                <span className="adm-trip-card-meta">{formatDates(t.startISO, t.endISO)}</span>
                <code className="adm-trip-card-id">{t.id}</code>
              </button>

              <div className="adm-trip-toolbar" onClick={e => e.stopPropagation()}>
                <button type="button" className="adm-tool" title="Rename" onClick={e => openRename(e, t)} disabled={modalBusy}>
                  <span className="adm-tool-icon">✎</span>
                  <span className="adm-tool-label">Rename</span>
                </button>
                <button type="button" className="adm-tool" title="Duplicate" onClick={e => openDuplicate(e, t)} disabled={modalBusy}>
                  <span className="adm-tool-icon">⎘</span>
                  <span className="adm-tool-label">Duplicate</span>
                </button>
                <button type="button" className="adm-tool" title="Copy public link" onClick={e => copyLink(e, t)}>
                  <span className="adm-tool-icon">{copiedId === t.id ? '✓' : '🔗'}</span>
                  <span className="adm-tool-label">{copiedId === t.id ? 'Copied' : 'Link'}</span>
                </button>
                <button type="button" className="adm-tool adm-tool-danger" title="Delete" onClick={e => openDelete(e, t)} disabled={modalBusy}>
                  <span className="adm-tool-icon">⌫</span>
                  <span className="adm-tool-label">Delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <AdminModal
        open={modal.kind === 'new'}
        title="New trip"
        onClose={closeModal}
        footer={
          <ModalActions
            onCancel={closeModal}
            submitLabel="Create trip"
            onSubmit={() => submitNew()}
            disabled={!newId.trim()}
          />
        }
      >
        <form onSubmit={submitNew}>
          <ModalField label="Trip ID" hint="Used in the URL — e.g. cohen-france-2027" error={fieldErr ?? undefined}>
            <input
              value={newId}
              onChange={e => { setNewId(e.target.value); setFieldErr(null) }}
              placeholder="meroz-italy-2026"
              autoComplete="off"
            />
          </ModalField>
        </form>
      </AdminModal>

      <AdminModal
        open={modal.kind === 'rename'}
        title="Rename trip"
        onClose={closeModal}
        footer={
          <ModalActions
            onCancel={closeModal}
            submitLabel="Save name"
            onSubmit={submitRename}
            loading={modalBusy}
            disabled={!renameTitle.trim()}
          />
        }
      >
        <ModalField label="Display name" error={fieldErr ?? undefined}>
          <input
            value={renameTitle}
            onChange={e => { setRenameTitle(e.target.value); setFieldErr(null) }}
            placeholder="Meroz In Italia"
          />
        </ModalField>
        {modal.kind === 'rename' && (
          <p className="adm-modal-note">Trip ID stays <code>{modal.trip.id}</code> — only the visible name changes.</p>
        )}
      </AdminModal>

      <AdminModal
        open={modal.kind === 'duplicate'}
        title="Duplicate trip"
        onClose={closeModal}
        footer={
          <ModalActions
            onCancel={closeModal}
            submitLabel="Create copy"
            onSubmit={submitDuplicate}
            loading={modalBusy}
            disabled={!dupId.trim() || !dupTitle.trim()}
          />
        }
      >
        <ModalField label="New trip ID" hint="Must be unique" error={fieldErr ?? undefined}>
          <input
            value={dupId}
            onChange={e => { setDupId(e.target.value); setFieldErr(null) }}
            placeholder="meroz-italy-2027"
            autoComplete="off"
          />
        </ModalField>
        <ModalField label="Display name">
          <input
            value={dupTitle}
            onChange={e => setDupTitle(e.target.value)}
            placeholder="Trip name"
          />
        </ModalField>
      </AdminModal>

      <AdminModal
        open={modal.kind === 'delete'}
        title="Delete trip"
        onClose={closeModal}
        footer={
          <ModalActions
            onCancel={closeModal}
            submitLabel="Delete permanently"
            onSubmit={submitDelete}
            danger
            loading={modalBusy}
          />
        }
      >
        {modal.kind === 'delete' && (
          <>
            <p className="adm-modal-lead">
              Delete <strong>{modal.trip.title}</strong> (<code>{modal.trip.id}</code>)?
            </p>
            <p className="adm-modal-note adm-modal-note-danger">
              This removes the trip from GitHub and cannot be undone.
            </p>
            {fieldErr && <p className="adm-modal-error">{fieldErr}</p>}
          </>
        )}
      </AdminModal>
    </div>
  )
}
