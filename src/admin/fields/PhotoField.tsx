import { useState } from 'react'
import { A } from '../../types'
import { getCloudConfig, uploadImage } from '../../cloud'
import { fileToDataUrl } from '../utils'

type Props = { label: string; value: string; onSet: (v: string) => void }

export default function PhotoField({ label, value, onSet }: Props) {
  const [busy, setBusy] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [dragging, setDragging] = useState(false)

  const upload = async (file: File) => {
    setBusy(true)
    setUploadErr('')
    try {
      onSet(getCloudConfig() ? await uploadImage(file) : await fileToDataUrl(file))
    } catch (err) {
      setUploadErr(String(err))
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

  return (
    <div
      className={`adm-photo${dragging ? ' adm-photo-drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="adm-photo-top">
        <span>{label}</span>
        <label className="adm-photo-btn">
          {busy ? '⏳…' : value ? '🔄 Replace' : '📷 Upload'}
          <input type="file" accept="image/*" onChange={pick} hidden />
        </label>
      </div>
      {uploadErr && <p className="adm-error">{uploadErr}</p>}
      {value
        ? <img className="adm-photo-prev" src={A(value)} alt="" style={{objectPosition:'center'}} />
        : <div className="adm-photo-empty">{dragging ? '📷 Drop to upload' : 'Drag & drop or click Upload'}</div>}
    </div>
  )
}
