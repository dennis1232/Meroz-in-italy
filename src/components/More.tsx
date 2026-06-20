import Tips from './Tips'
import Contact from './Contact'

export default function More({ openIntro }: { openIntro: () => void }) {
  return (
    <section className="screen active">
      <Tips openIntro={openIntro} />
      <Contact />
    </section>
  )
}
