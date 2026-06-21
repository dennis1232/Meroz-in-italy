import { useState } from 'react'
import { logo, isIOS } from '../../ui'
import { t } from '../../i18n'

export default function IntroModal({
  onClose,
  installPrompt,
  onInstalled
}: {
  onClose: () => void
  installPrompt: any
  onInstalled: () => void
}) {
  const [dontShow, setDontShow] = useState(true)
  const close = () => {
    if (dontShow) localStorage.setItem('meroz_intro_seen', '1')
    onClose()
  }
  const install = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    onInstalled()
  }
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-scroll">
          <img className="modal-logo" src={logo} alt="" />
          <h2>{t('introWelcome')}</h2>
          <p className="lead">{t('introLead')}</p>

          <div className="modal-card offline">
            <div className="mc-ic">📶</div>
            <div>
              <b>{t('introOfflineTitle')}</b>
              <span>{t('introOfflineDesc')}</span>
            </div>
          </div>

          <div className="modal-card">
            <div className="mc-ic">📲</div>
            <div className="mc-body">
              <b>{t('introAddTitle')}</b>
              {isIOS ? (
                <ol className="steps">
                  <li>{t('introIosStep1')}</li>
                  <li>{t('introIosStep2')} <span className="share-ic">⬆</span></li>
                  <li>{t('introIosStep3')}</li>
                  <li>{t('introIosStep4')}</li>
                </ol>
              ) : installPrompt ? (
                <>
                  <button className="install-now" onClick={install}>{t('introInstallNow')}</button>
                  <span className="muted-note">{t('introInstallAlt')}</span>
                </>
              ) : (
                <ol className="steps">
                  <li>{t('introAndStep1')} <span className="share-ic">⋮</span></li>
                  <li>{t('introAndStep2')}</li>
                  <li>{t('introAndStep3')}</li>
                </ol>
              )}
              <span className="muted-note">{t('introIconNote')}</span>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <label className="modal-check">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            {t('introDontShow')}
          </label>
          <button type="button" className="modal-btn" onClick={close}>
            {t('introClose')}
          </button>
        </div>
      </div>
    </div>
  )
}
