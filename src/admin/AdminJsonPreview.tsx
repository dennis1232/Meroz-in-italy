import { useState } from 'react'
import { toClean, type TripRaw } from '../tripUtils'

type Props = { trip: TripRaw }

export default function AdminJsonPreview({ trip }: Props) {
  const [open, setOpen] = useState(false)
  const json = JSON.stringify(toClean(trip), null, 2)
  const copy = () => navigator.clipboard.writeText(json)

  return (
    <div id="adm-json" className="adm-json-preview">
      <button className="adm-json-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▲' : '▼'} JSON Preview
      </button>
      {open && (
        <div className="adm-json-body">
          <button className="adm-json-copy" onClick={copy}>Copy</button>
          <pre>{json}</pre>
        </div>
      )}
    </div>
  )
}
