import { useEffect, useMemo, useRef, useState } from 'react'
import { days, attractions, places, contact, type Day, type Stop, type Spot } from './data'
import Map from './Map'

const BASE = import.meta.env.BASE_URL
const logo = `${BASE}assets/logo.png`

const dayColors = ['#9c3b2e', '#c9772e', '#2f4a36', '#7d2f24', '#b5651d', '#4a6741', '#a0522d']
const colorFor = (n: number) => dayColors[n % dayColors.length]

const gmaps = (s: { name: string; lat?: number; lng?: number }) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ' Italy')}`

const TAG_EMOJI: Record<string, string> = {
  food: '🍽️', cafe: '☕', site: '🏛️', wine: '🍷', gelato: '🍦', hotel: '🏨', shop: '🛍️'
}

const waze = (s: { lat: number; lng: number }) => `waze://?ll=${s.lat},${s.lng}&navigate=yes`

type Tab = 'home' | 'trip' | 'map' | 'see' | 'more'

const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true)

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [targetDay, setTargetDay] = useState<number | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    if (!isStandalone && !localStorage.getItem('meroz_intro_seen')) setShowIntro(true)
    const _td = new Date()
    const _tds = `${String(_td.getDate()).padStart(2,'0')}/${String(_td.getMonth()+1).padStart(2,'0')}`
    const _tday = days.find(d => d.date === _tds)
    if (_tday) { setTargetDay(_tday.n); setTab('trip') }
    // Chrome (Android/desktop) fires this when the app is installable — capture for a 1-tap install
    const onPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setInstallPrompt(null))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const goToDay = (n: number) => {
    setTargetDay(n)
    setTab('trip')
  }
  const goTab = (t: Tab) => {
    if (t !== 'trip') setTargetDay(null)
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="app">
      {tab === 'home' && <Overview goToDay={goToDay} />}
      {tab === 'trip' && <Itinerary targetDay={targetDay} />}
      {tab === 'map' && <MapScreen />}
      {tab === 'see' && <MustSee />}
      {tab === 'more' && <More openIntro={() => setShowIntro(true)} />}

      <nav className="tabbar">
        <Tb id="home" t={tab} set={goTab} ic="🏠" label="בית" />
        <Tb id="trip" t={tab} set={goTab} ic="📅" label="מסלול" />
        <Tb id="map" t={tab} set={goTab} ic="🗺️" label="מפה" />
        <Tb id="see" t={tab} set={goTab} ic="⭐" label="אטרקציות" />
        <Tb id="more" t={tab} set={goTab} ic="ℹ️" label="מידע" />
      </nav>

      {showIntro && (
        <IntroModal
          onClose={() => setShowIntro(false)}
          installPrompt={installPrompt}
          onInstalled={() => setInstallPrompt(null)}
        />
      )}
    </div>
  )
}

function Tb({ id, t, set, ic, label }: { id: Tab; t: Tab; set: (x: Tab) => void; ic: string; label: string }) {
  return (
    <button className={t === id ? 'on' : ''} onClick={() => set(id)}>
      <span className="ic">{ic}</span>
      <span>{label}</span>
    </button>
  )
}

/* ---------- INTRO MODAL ---------- */
function IntroModal({
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
        <img className="modal-logo" src={logo} alt="" />
        <h2>ברוכים הבאים 🇮🇹</h2>
        <p className="lead">מדריך הטיול שלכם לטוסקנה ורומא – הכל במקום אחד.</p>

        <div className="modal-card offline">
          <div className="mc-ic">📶</div>
          <div>
            <b>עובד גם בלי אינטרנט</b>
            <span>אחרי הביקור הראשון האפליקציה נשמרת במכשיר ותעבוד גם במצב טיסה. (המפות נטענות באזורים שכבר צפיתם בהם).</span>
          </div>
        </div>

        <div className="modal-card">
          <div className="mc-ic">📲</div>
          <div className="mc-body">
            <b>הוסיפו למסך הבית</b>
            {isIOS ? (
              <ol className="steps">
                <li>פתחו את האתר ב‑Safari</li>
                <li>לחצו על כפתור השיתוף <span className="share-ic">⬆</span> (בתחתית המסך)</li>
                <li>גללו ובחרו <b>"הוסף למסך הבית"</b></li>
                <li>לחצו <b>"הוסף"</b> ← מוכן!</li>
              </ol>
            ) : installPrompt ? (
              <>
                <button className="install-now" onClick={install}>📲 התקן עכשיו</button>
                <span className="muted-note">או דרך תפריט הדפדפן ⋮ → "התקן אפליקציה"</span>
              </>
            ) : (
              <ol className="steps">
                <li>פתחו את תפריט הדפדפן <span className="share-ic">⋮</span></li>
                <li>בחרו <b>"התקן אפליקציה"</b> או <b>"הוסף למסך הבית"</b></li>
                <li>אשרו ← מוכן!</li>
              </ol>
            )}
            <span className="muted-note">כך תקבלו אייקון משלכם ומסך מלא בלי שורת הדפדפן.</span>
          </div>
        </div>

        <label className="modal-check">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
          אל תציגו לי שוב
        </label>
        <button className="modal-btn" onClick={close}>
          הבנתי, יאללה בואו נתחיל 😊
        </button>
      </div>
    </div>
  )
}

/* ---------- OVERVIEW ---------- */
function Overview({ goToDay }: { goToDay: (n: number) => void }) {
  const _now = new Date()
  const _start = new Date('2026-06-22')
  const _end = new Date('2026-07-05')
  const _day1 = _now >= _start && _now < _end
    ? Math.floor((_now.getTime() - _start.getTime()) / 86400000) + 1
    : null
  const _daysLeft = _now < _start
    ? Math.ceil((_start.getTime() - _now.getTime()) / 86400000)
    : null
  return (
    <section className="screen active">
      <div className="cover" style={{ backgroundImage: `url(${BASE}assets/cover.webp)` }}>
        <img className="logo" src={logo} alt="Meroz In Italia" />
        <div className="dates" dir="ltr">22/06 – 04/07</div>
        <div className="who">שרון ודניס · טוסקנה &amp; רומא 🇮🇹</div>
      </div>
      {_daysLeft !== null && (
        <div className="countdown">✈️ עוד <b>{_daysLeft}</b> ימים לטיסה!</div>
      )}
      {_day1 !== null && (
        <div className="countdown in-trip">🇮🇹 יום <b>{_day1}</b> מתוך 13</div>
      )}

      <div className="section-script">
        <span className="s">trip</span>
        <span className="h">OVERVIEW</span>
      </div>

      <div className="polaroids">
        {days.slice(0, 12).map((d) => (
          <button className="pola" key={d.n} onClick={() => goToDay(d.n)}>
            <img src={d.hero} alt={d.title} loading="lazy" />
            <div className="cap">{d.dow}</div>
            <div className="cd">{d.date}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ---------- ITINERARY ---------- */
function Itinerary({ targetDay }: { targetDay: number | null }) {
  const listRef = useRef<HTMLDivElement>(null)
  const todayStr = useMemo(() => {
    const t = new Date()
    return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}`
  }, [])

  useEffect(() => {
    if (targetDay == null) return
    // wait for the card to open & render, then scroll it under the sticky topbar
    const t = setTimeout(() => {
      const el = document.getElementById(`day-${targetDay}`)
      if (!el) return
      const topbarH = (document.querySelector('.topbar') as HTMLElement)?.offsetHeight ?? 70
      const y = el.getBoundingClientRect().top + window.scrollY - topbarH - 8
      window.scrollTo({ top: Math.max(0, y) })
    }, 120)
    return () => clearTimeout(t)
  }, [targetDay])

  return (
    <section className="screen active">
      <Topbar title="מסלול הטיול" sub="Travel itinerary" />
      <div className="daylist" ref={listRef}>
        {days.map((d) => (
          <DayCard key={d.n} d={d} defaultOpen={targetDay != null ? d.n === targetDay : d.n === 1} isToday={d.date === todayStr} />
        ))}
      </div>
    </section>
  )
}

function DayCard({ d, defaultOpen, isToday }: { d: Day; defaultOpen: boolean; isToday?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const color = colorFor(d.n)
  return (
    <article id={`day-${d.n}`} className={'daycard' + (open ? ' open' : '')}>
      <div className="hero" onClick={() => setOpen((o) => !o)}>
        <img src={d.hero} alt={d.title} loading="lazy" />
        <div className="scrim" />
        <div className="badge">
          <small>DAY</small>
          <b>{d.n}</b>
          {isToday && <span className="today-badge">היום</span>}
        </div>
        <div className="meta">
          <div className="dow">{d.dow}</div>
          <div className="en">{d.en}</div>
        </div>
      </div>

      <div className="banner">{d.title}</div>
      {d.intro && <div className="intro">{d.intro}</div>}

      <div className="daybody">
        <ul className="stops">
          {d.stops.map((s, i) => {
            // car drive -> Waze (to its own pin, or the next pinned stop); place -> Google map.
            // train/flight legs get no nav button. Never two buttons on one row.
            const isDrive = !!s.move && !s.via
            const icon = s.via === 'train' ? '🚆' : s.via === 'flight' ? '✈️' : s.move ? '🚗' : null
            const stopsAfter = d.stops.slice(i + 1)
            const nextMoveIdx = stopsAfter.findIndex(x => x.move)
            const untilNextMove = nextMoveIdx === -1 ? stopsAfter : stopsAfter.slice(0, nextMoveIdx)
            const hasNearbyParking = untilNextMove.some(x => x.parking)
            const wazeTarget = isDrive && !hasNearbyParking
              ? s.lat != null ? s : stopsAfter.find(x => x.lat != null)
              : undefined
            if (s.move) {
              return (
                <li key={i} className="move-leg">
                  <span className="ml-icon">{icon ?? '🚗'}</span>
                  <div className="ml-body">
                    <span className="ml-name">{s.name}</span>
                    {s.desc && <span className="ml-dur">{s.desc}</span>}
                  </div>
                  {isDrive && wazeTarget && (
                    <a className="go waze ml-waze" href={waze(wazeTarget as any)}>Waze</a>
                  )}
                </li>
              )
            }
            return (
              <li key={i}>
                <span className="dot" />
                <div className="body">
                  <div className="nm">
                    {s.tag && <span className="stop-tag">{TAG_EMOJI[s.tag]}</span>}
                    {s.parking && <span className="stop-tag">🅿️</span>}
                    <bdi className="nm-txt">{s.name}</bdi>
                    {s.time && <span className="time">{s.time}</span>}
                  </div>
                  {s.desc && <div className="ds">{s.desc}</div>}
                </div>
                <div className="acts">
                  {s.parking && s.lat != null && (
                    <a className="go waze park" href={waze(s as any)}>
                      🅿️ להחנות פה
                    </a>
                  )}
                  {!s.parking && s.lat != null && (
                    <a className="go" href={gmaps(s)} target="_blank" rel="noopener">
                      מפה
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {open && d.stops.some((s) => s.lat != null) && (
          <div className="daymap">
            <Map stops={d.stops} route color={color} />
          </div>
        )}
      </div>

      <div className="expander" onClick={() => setOpen((o) => !o)}>
        {open ? 'סגור' : 'פתח את היום'} <span className="chev">▾</span>
      </div>
    </article>
  )
}

/* ---------- MAP SCREEN ---------- */
function MapScreen() {
  const [day, setDay] = useState<number>(0) // 0 = all
  const stops: Stop[] = day === 0 ? days.flatMap((d) => d.stops) : days[day - 1].stops
  const color = day === 0 ? '#9c3b2e' : colorFor(day)
  return (
    <section className="screen active mapwrap">
      <Topbar title="מפת הטיול" sub="all stops" />
      <div className="dayfilter">
        <button className={day === 0 ? 'on' : ''} onClick={() => setDay(0)}>הכל</button>
        {days.map((d) => (
          <button key={d.n} className={day === d.n ? 'on' : ''} onClick={() => setDay(d.n)}>
            יום {d.n}
          </button>
        ))}
      </div>
      <div className="bigmap">
        <Map key={day} stops={stops} route={day !== 0} color={color} />
      </div>
    </section>
  )
}

/* ---------- MUST SEE ---------- */
function MustSee() {
  return (
    <section className="screen active">
      <div className="mustsee">
        <div className="section-script">
          <span className="s">must see</span>
          <span className="h">ATTRACTIONS</span>
        </div>
        <div className="attr-grid">
          {attractions.map((a) => (
            <div className="attr" key={a.name}>
              <img src={a.img} alt={a.name} loading="lazy" />
              <div className="t">{a.name}</div>
              <div className="d">{a.desc}</div>
              <a className="pin" href={gmaps(a)} target="_blank" rel="noopener">פתח במפה ↗</a>
            </div>
          ))}
        </div>

        <div className="section-script">
          <span className="s">must see</span>
          <span className="h">PLACES</span>
        </div>
        <div className="places-grid">
          {places.map((p: Spot) => (
            <a className="place" key={p.name} href={gmaps(p)} target="_blank" rel="noopener">
              <img src={p.img} alt={p.name} loading="lazy" />
              <span className="cap">{p.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- MORE: tips + contact ---------- */
function More({ openIntro }: { openIntro: () => void }) {
  return (
    <section className="screen active">
      <Tips openIntro={openIntro} />
      <Contact />
    </section>
  )
}

function Tips({ openIntro }: { openIntro: () => void }) {
  const items = [
    { ic: '🧳', h: 'לפני הטיסה – לא לשכוח', p: 'רישיון נהיגה ישראלי, רישיון נהיגה בינלאומי, כרטיס האשראי שאיתו הזמנתם את הרכב, ודרכון (כמובן).' },
    { ic: '🛣️', h: 'אוטוסטרדה', p: <>בכניסה לכביש המהיר <b>אל תעלו על המסלול הצהוב</b> (TELEPASS). קחו כרטיס בכניסה, ובַיציאה דאגו לשלם – כך תמנעו מדוחות.</> },
    { ic: '🚫', h: 'פירנצה ו-ZTL', p: 'אם נכנסים עם רכב לפירנצה ליום אחד – אין סיבה לדאגה. החניון המוזכר נמצא מחוץ לאזור ה-ZTL ולא תסתכנו בקנס.' },
    { ic: '📱', h: 'דוחות ו-WAZE', p: 'השימוש ב-WAZE מניח את הדעת מהפחד לקבל קנס. הוא מתריע על דרכים בעייתיות ועל כניסה לאזורי ZTL, ומאפשר לעבור רק כשמותר.' },
    { ic: '⚡', h: 'מהירות', p: <>עד <b>130 קמ״ש</b> בכבישים מהירים, <b>70–90 קמ״ש</b> בדרכים שאינן מהירות / עירוניות. שימו לב להתראות ולמכמונות מהירות.</> },
    { ic: '🌄', h: 'דרכים כפריות', p: 'שימו לב למהירות והיו מודעים אליה כל הזמן – בדרכים הכפריות שמים על זה דגש מאוד גדול.' },
    { ic: '🅿️', h: 'חניונים', p: 'שולחים לכם הרבה חניונים שחוסכים כאב ראש. אפשר לשלם במדחני החניה – במטבעות או בכרטיס אשראי.' }
  ]
  return (
    <div className="tips">
      <div className="brand">trip<b>ADVICE</b></div>
      <button className="install-help" onClick={openIntro}>📲 איך מוסיפים למסך הבית / עבודה אופליין</button>
      {items.map((t, i) => (
        <div className="tipcard" key={i}>
          <h3><span>{t.ic}</span>{t.h}</h3>
          <p>{t.p}</p>
        </div>
      ))}
    </div>
  )
}

function Contact() {
  return (
    <div className="contact">
      <div className="arr">ARRIVEDERCI</div>
      <img className="logo" src={logo} alt="Meroz In Italia" />
      <p>תודה שטיילתם איתנו 😊</p>
      <div className="lines">
        <a className="row" href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener">
          📸 @{contact.instagram}
        </a>
        <a className="row" href={`tel:${contact.phoneILraw}`}>🇮🇱 {contact.phoneIL}</a>
        <a className="row" href={`tel:${contact.phoneITraw}`}>🇮🇹 {contact.phoneIT}</a>
      </div>
      <div className="links">
        <a href="https://www.waze.com/" target="_blank" rel="noopener">Waze</a>
        <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google Maps</a>
        <a href="https://www.italotreno.com/en" target="_blank" rel="noopener">ITALO</a>
      </div>
    </div>
  )
}

/* ---------- shared ---------- */
function Topbar({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="topbar">
      <div>
        <div className="ttl">{title}</div>
        <div className="sub script">{sub}</div>
      </div>
      <img className="logo" src={logo} alt="" />
    </div>
  )
}
