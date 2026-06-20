type Props = {
  tripId: string
  saved: boolean
  saving: boolean
  saveErr: string
  shareMsg: string
  onSave: () => void
  onPreview: () => void
  onShare: () => void
}

export default function AdminTopbar({
  tripId, saved, saving, saveErr, shareMsg, onSave, onPreview, onShare
}: Props) {
  return (
    <div className="adm-topbar">
      <div className="adm-topbar-left">
        <button className="adm-btn adm-back" onClick={() => location.href = '/admin'}>← Trips</button>
        <h1>✏️ {tripId}</h1>
      </div>
      <span className="adm-saved">{saved ? '✓ saved' : ''}</span>
      <div className="adm-actions">
        <button className="adm-btn adm-save" onClick={onSave} disabled={saving}>
          {saving ? '⏳ Saving…' : '☁️ Save'}
        </button>
        {saveErr && <span style={{ color: '#f87171', fontSize: 12 }}>{saveErr}</span>}
        <button className="adm-btn adm-preview" onClick={onPreview}>👁 Preview</button>
        <button className="adm-btn adm-preview" onClick={onShare}>
          {shareMsg || '🔗 Copy link'}
        </button>
      </div>
    </div>
  )
}
