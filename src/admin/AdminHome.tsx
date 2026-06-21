import { useCallback, useEffect, useState } from 'react'
import { copyTripLink } from '../ui'
import AdminModal, { ModalActions, ModalField } from './AdminModal'
import AdminTripCard from './AdminTripCard'
import { useAdminModals, type TripEntry } from './useAdminModals'

export default function AdminHome() {
  const [trips, setTrips] = useState<TripEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/list-trips', { cache: 'no-cache' })
      if (res.ok) { setTrips(await res.json()); return }
    } catch { /* local dev without functions */ }
    const res = await fetch(`${import.meta.env.BASE_URL}trips/index.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(res.status.toString())
    setTrips(await res.json())
  }, [])

  useEffect(() => {
    reload().catch(e => setError(`Could not load trips/index.json: ${e.message}`))
  }, [reload])

  const {
    modal, modalBusy, fieldErr,
    newId, setNewId, renameTitle, setRenameTitle, dupId, setDupId, dupTitle, setDupTitle,
    openNew, openRename, openDuplicate, openDelete, closeModal,
    submitNew, submitRename, submitDuplicate, submitDelete,
  } = useAdminModals(trips, reload)

  const copyLink = (e: React.MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    copyTripLink(trip.id).then(() => { setCopiedId(trip.id); setTimeout(() => setCopiedId(null), 2000) })
  }

  const q = query.trim().toLowerCase()
  const filtered = q ? trips.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) : trips

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
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name or trip ID…" />
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
          <div className="adm-empty"><p>No trips match "{query.trim()}".</p></div>
        )}

        <div className="adm-trip-list">
          {filtered.map(t => (
            <AdminTripCard
              key={t.id}
              trip={t}
              disabled={modalBusy}
              copiedId={copiedId}
              onOpen={() => { location.href = `/admin/${t.id}` }}
              onRename={e => openRename(e, t)}
              onDuplicate={e => openDuplicate(e, t)}
              onCopyLink={e => copyLink(e, t)}
              onDelete={e => openDelete(e, t)}
            />
          ))}
        </div>
      </div>

      <AdminModal open={modal.kind === 'new'} title="New trip" onClose={closeModal}
        footer={<ModalActions onCancel={closeModal} submitLabel="Create trip" onSubmit={() => submitNew()} disabled={!newId.trim()} />}>
        <form onSubmit={submitNew}>
          <ModalField label="Trip ID" hint="Used in the URL — e.g. cohen-france-2027" error={fieldErr ?? undefined}>
            <input value={newId} onChange={e => { setNewId(e.target.value); }} placeholder="meroz-italy-2026" autoComplete="off" />
          </ModalField>
        </form>
      </AdminModal>

      <AdminModal open={modal.kind === 'rename'} title="Rename trip" onClose={closeModal}
        footer={<ModalActions onCancel={closeModal} submitLabel="Save name" onSubmit={submitRename} loading={modalBusy} disabled={!renameTitle.trim()} />}>
        <ModalField label="Display name" error={fieldErr ?? undefined}>
          <input value={renameTitle} onChange={e => setRenameTitle(e.target.value)} placeholder="Meroz In Italia" />
        </ModalField>
        {modal.kind === 'rename' && (
          <p className="adm-modal-note">Trip ID stays <code>{modal.trip.id}</code> — only the visible name changes.</p>
        )}
      </AdminModal>

      <AdminModal open={modal.kind === 'duplicate'} title="Duplicate trip" onClose={closeModal}
        footer={<ModalActions onCancel={closeModal} submitLabel="Create copy" onSubmit={submitDuplicate} loading={modalBusy} disabled={!dupId.trim() || !dupTitle.trim()} />}>
        <ModalField label="New trip ID" hint="Must be unique" error={fieldErr ?? undefined}>
          <input value={dupId} onChange={e => { setDupId(e.target.value); }} placeholder="meroz-italy-2027" autoComplete="off" />
        </ModalField>
        <ModalField label="Display name">
          <input value={dupTitle} onChange={e => setDupTitle(e.target.value)} placeholder="Trip name" />
        </ModalField>
      </AdminModal>

      <AdminModal open={modal.kind === 'delete'} title="Delete trip" onClose={closeModal}
        footer={<ModalActions onCancel={closeModal} submitLabel="Delete permanently" onSubmit={submitDelete} danger loading={modalBusy} />}>
        {modal.kind === 'delete' && (
          <>
            <p className="adm-modal-lead">Delete <strong>{modal.trip.title}</strong> (<code>{modal.trip.id}</code>)?</p>
            <p className="adm-modal-note adm-modal-note-danger">This removes the trip from GitHub and cannot be undone.</p>
            {fieldErr && <p className="adm-modal-error">{fieldErr}</p>}
          </>
        )}
      </AdminModal>
    </div>
  )
}
