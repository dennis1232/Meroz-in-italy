import { useState } from 'react'
import { A } from '../../types'
import { getCloudConfig, uploadImage } from '../../cloud'
import { fileToDataUrl } from '../utils'

type Props = { label: string; value: string; onSet: (v: string) => void }

export default function PhotoField({ label, value, onSet }: Props) {
  const [busy, setBusy] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setUploadErr('')
    try {
      if (getCloudConfig()) {
        onSet(await uploadImage(file))
      } else {
        onSet(await fileToDataUrl(file))
      }
    } catch (err) {
      setUploadErr(String(err))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="adm-photo">
      <div className="adm-photo-top">
        <span>{label}</span>
        <label className="adm-photo-btn">
          {busy ? '⏳…' : value ? '🔄 Replace' : '📷 Upload'}
          <input type="file" accept="image/*" onChange={pick} hidden />
        </label>
      </div>
      {uploadErr && <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{uploadErr}</div>}
      {value
        ? <img className="adm-photo-prev" src={A(value)} alt="" />
        : <div className="adm-photo-empty">no photo</div>}
    </div>
  )
}
