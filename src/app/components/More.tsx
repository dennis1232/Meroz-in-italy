import Tips from './Tips'
import Contact from './Contact'
import CalendarExportButton from '../../features/calendar/CalendarExportButton'

export default function More({ openIntro }: { openIntro: () => void }) {
  return (
    <section className="screen active">
      <Tips openIntro={openIntro} />
      <CalendarExportButton />
      <Contact />
    </section>
  )
}
