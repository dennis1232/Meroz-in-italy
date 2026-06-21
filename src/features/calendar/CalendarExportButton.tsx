import { useState } from 'react'
import { meta, days } from '../../store'
import { downloadCalendar } from './calendarExport'
import { t } from '../../i18n'

export default function CalendarExportButton() {
  const [done, setDone] = useState(false)

  const handle = () => {
    downloadCalendar(meta, days)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <button className="cal-export-btn" onClick={handle}>
      {done ? '✓ ' + t('calendarDone') : '📅 ' + t('calendarExport')}
    </button>
  )
}
