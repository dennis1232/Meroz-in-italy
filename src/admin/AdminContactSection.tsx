import { type TripRaw } from '../tripUtils'

type Props = {
  contact: TripRaw['contact']
  onChange: (contact: TripRaw['contact']) => void
}

export default function AdminContactSection({ contact, onChange }: Props) {
  return (
    <div id="adm-contact" className="adm-section">
      <h2>Contact</h2>
      <div className="adm-row3">
        <label>Instagram
          <input value={contact.instagram} onChange={(e) => onChange({ ...contact, instagram: e.target.value })} />
        </label>
        <label>Phone IL
          <input
            type="tel"
            value={contact.phoneIL}
            onChange={(e) => onChange({
              ...contact,
              phoneIL: e.target.value,
              phoneILraw: e.target.value.replace(/[^+\d]/g, '')
            })}
          />
        </label>
        <label>Phone IT
          <input
            type="tel"
            value={contact.phoneIT}
            onChange={(e) => onChange({
              ...contact,
              phoneIT: e.target.value,
              phoneITraw: e.target.value.replace(/[^+\d]/g, '')
            })}
          />
        </label>
      </div>
    </div>
  )
}
