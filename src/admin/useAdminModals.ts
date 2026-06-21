import { useState, type FormEvent, type MouseEvent } from 'react'
import { manageTrip } from '../cloud'
import { toClean, toRaw } from '../tripUtils'

export type TripEntry = { id: string; title: string; startISO: string; endISO: string; cover?: string }

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
    try { return toClean(JSON.parse(draft)) } catch { /* fall through */ }
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

export function useAdminModals(trips: TripEntry[], reload: () => Promise<void>) {
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [modalBusy, setModalBusy] = useState(false)
  const [fieldErr, setFieldErr] = useState<string | null>(null)
  const [newId, setNewId] = useState('')
  const [renameTitle, setRenameTitle] = useState('')
  const [dupId, setDupId] = useState('')
  const [dupTitle, setDupTitle] = useState('')

  const closeModal = () => {
    if (modalBusy) return
    setModal({ kind: 'none' })
    setFieldErr(null)
  }

  const openNew = () => { setNewId(''); setFieldErr(null); setModal({ kind: 'new' }) }

  const openRename = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    setRenameTitle(trip.title); setFieldErr(null); setModal({ kind: 'rename', trip })
  }

  const openDuplicate = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation()
    setDupId(`${trip.id}-copy`); setDupTitle(`${trip.title} (copy)`)
    setFieldErr(null); setModal({ kind: 'duplicate', trip })
  }

  const openDelete = (e: MouseEvent, trip: TripEntry) => {
    e.stopPropagation(); setFieldErr(null); setModal({ kind: 'delete', trip })
  }

  const submitNew = (e?: FormEvent) => {
    e?.preventDefault()
    const id = newId.trim()
    if (!ID_RE.test(id)) { setFieldErr('Use lowercase letters, numbers, and hyphens only.'); return }
    if (trips.find(t => t.id === id)) { setFieldErr('A trip with this ID already exists.'); return }
    location.href = `/admin/${id}`
  }

  const submitRename = async () => {
    if (modal.kind !== 'rename') return
    const title = renameTitle.trim()
    if (!title) { setFieldErr('Enter a trip name.'); return }
    if (title === modal.trip.title) { closeModal(); return }
    setModalBusy(true); setFieldErr(null)
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
      await reload(); closeModal()
    } catch (err) { setFieldErr(String(err)) }
    finally { setModalBusy(false) }
  }

  const submitDuplicate = async () => {
    if (modal.kind !== 'duplicate') return
    const newTripId = dupId.trim()
    const title = dupTitle.trim()
    if (!ID_RE.test(newTripId)) { setFieldErr('Trip ID must use lowercase letters, numbers, and hyphens only.'); return }
    if (!title) { setFieldErr('Enter a name for the copy.'); return }
    if (trips.find(t => t.id === newTripId)) { setFieldErr('A trip with this ID already exists.'); return }
    setModalBusy(true); setFieldErr(null)
    try {
      const tripData = await loadSourceTripJson(modal.trip.id)
      const result = await manageTrip({ action: 'duplicate', tripId: modal.trip.id, newTripId, title, tripData })
      if (result.tripData) seedTripDraft(newTripId, result.tripData)
      location.href = `/admin/${newTripId}`
    } catch (err) { setFieldErr(String(err)); setModalBusy(false) }
  }

  const submitDelete = async () => {
    if (modal.kind !== 'delete') return
    setModalBusy(true); setFieldErr(null)
    try {
      await manageTrip({ action: 'delete', tripId: modal.trip.id })
      localStorage.removeItem(`draft-${modal.trip.id}`)
      localStorage.removeItem(`preview-${modal.trip.id}`)
      await reload(); closeModal()
    } catch (err) { setFieldErr(String(err)) }
    finally { setModalBusy(false) }
  }

  return {
    modal, modalBusy, fieldErr,
    newId, setNewId, renameTitle, setRenameTitle, dupId, setDupId, dupTitle, setDupTitle,
    openNew, openRename, openDuplicate, openDelete, closeModal,
    submitNew, submitRename, submitDuplicate, submitDelete,
  }
}
