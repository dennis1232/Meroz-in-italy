import { t, lang, TIPS_HE, TIPS_EN } from '../i18n'

export default function Tips({ openIntro }: { openIntro: () => void }) {
  const items = lang() === 'en' ? TIPS_EN : TIPS_HE
  return (
    <div className="tips">
      <div className="brand">trip<b>ADVICE</b></div>
      <button className="install-help" onClick={openIntro}>{t('installHelp')}</button>
      {items.map((tip, i) => (
        <div className="tipcard" key={i}>
          <h3><span>{tip.ic}</span>{tip.h}</h3>
          <p>{tip.p}</p>
        </div>
      ))}
    </div>
  )
}
