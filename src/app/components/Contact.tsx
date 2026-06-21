import { contact } from '../../store'
import { t } from '../../i18n'
import { logo } from '../../ui'

export default function Contact() {
  return (
    <div className="contact">
      <div className="arr">ARRIVEDERCI</div>
      <img className="logo" src={logo} alt="Meroz In Italia" />
      <p>{t('thanks')}</p>
      <div className="lines">
        {contact.instagram && (
          <a className="row" href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener">
            📸 @{contact.instagram}
          </a>
        )}
        {contact.phoneIL && <a className="row" href={`tel:${contact.phoneILraw}`}>🇮🇱 {contact.phoneIL}</a>}
        {contact.phoneIT && <a className="row" href={`tel:${contact.phoneITraw}`}>🇮🇹 {contact.phoneIT}</a>}
      </div>
      <div className="links">
        <a href="https://www.waze.com/" target="_blank" rel="noopener">Waze</a>
        <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google Maps</a>
        <a href="https://www.italotreno.com/en" target="_blank" rel="noopener">ITALO</a>
      </div>
    </div>
  )
}
