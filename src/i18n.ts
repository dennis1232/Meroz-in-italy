import { meta } from './data'

type Lang = 'he' | 'en'

const S = {
  // tabs
  tabHome:   { he: 'בית',      en: 'Home' },
  tabTrip:   { he: 'מסלול',    en: 'Itinerary' },
  tabMap:    { he: 'מפה',      en: 'Map' },
  tabSee:    { he: 'אטרקציות', en: 'Highlights' },
  tabMore:   { he: 'מידע',     en: 'Info' },

  // itinerary topbar
  itineraryTitle: { he: 'מסלול הטיול',    en: 'Travel Itinerary' },
  itinerarySub:   { he: 'Travel itinerary', en: '' },

  // overview countdown
  countdownPre:  { he: '✈️ עוד', en: '✈️' },
  countdownPost: { he: 'ימים לטיסה!', en: 'days to go!' },

  // stop / map
  mapBtn:    { he: 'מפה',         en: 'Map' },
  openInMap: { he: 'פתח במפה ↗', en: 'Open in maps ↗' },

  // day card
  openDay:  { he: 'פתח את היום', en: 'Open day' },
  closeDay: { he: 'סגור',        en: 'Close' },

  // contact
  thanks: { he: 'תודה שטיילתם איתנו 😊', en: 'Thank you for traveling with us 😊' },

  // install / tips
  installHelp: { he: '📲 איך מוסיפים למסך הבית / עבודה אופליין', en: '📲 How to add to home screen / offline use' },

  // intro modal
  introWelcome:      { he: 'ברוכים הבאים 🇮🇹',     en: 'Welcome 🇮🇹' },
  introLead:         { he: 'מדריך הטיול שלכם – הכל במקום אחד.', en: 'Your travel guide – everything in one place.' },
  introOfflineTitle: { he: 'עובד גם בלי אינטרנט', en: 'Works offline too' },
  introOfflineDesc:  { he: 'אחרי הביקור הראשון האפליקציה נשמרת במכשיר ותעבוד גם במצב טיסה.', en: 'After the first visit the app is saved on your device and works in airplane mode.' },
  introAddTitle:     { he: 'הוסיפו למסך הבית',    en: 'Add to Home Screen' },
  introIosStep1:     { he: 'פתחו את האתר ב‑Safari', en: 'Open in Safari' },
  introIosStep2:     { he: 'לחצו על כפתור השיתוף (בתחתית המסך)', en: 'Tap the Share button (bottom of screen)' },
  introIosStep3:     { he: 'גללו ובחרו "הוסף למסך הבית"', en: 'Scroll and tap "Add to Home Screen"' },
  introIosStep4:     { he: 'לחצו "הוסף" ← מוכן!', en: 'Tap "Add" ← done!' },
  introInstallNow:   { he: '📲 התקן עכשיו',  en: '📲 Install now' },
  introInstallAlt:   { he: 'או דרך תפריט הדפדפן ⋮ → "התקן אפליקציה"', en: 'or via browser menu ⋮ → "Install app"' },
  introAndStep1:     { he: 'פתחו את תפריט הדפדפן ⋮', en: 'Open browser menu ⋮' },
  introAndStep2:     { he: 'בחרו "התקן אפליקציה" או "הוסף למסך הבית"', en: 'Tap "Install app" or "Add to Home Screen"' },
  introAndStep3:     { he: 'אשרו ← מוכן!', en: 'Confirm ← done!' },
  introIconNote:     { he: 'כך תקבלו אייקון משלכם ומסך מלא בלי שורת הדפדפן.', en: 'You\'ll get your own icon and a fullscreen experience without the browser bar.' },
  introDontShow:     { he: 'אל תציגו לי שוב', en: "Don't show again" },
  introClose:        { he: 'הבנתי, יאללה בואו נתחיל 😊', en: "Got it, let's go 😊" },
} satisfies Record<string, Record<Lang, string>>

export function t(key: keyof typeof S): string {
  const lang: Lang = (meta.lang ?? 'he') as Lang
  return S[key][lang]
}

export function lang(): Lang {
  return (meta.lang ?? 'he') as Lang
}

// Tips content — structured separately due to JSX
export const TIPS_HE = [
  { ic: '🧳', h: 'לפני הטיסה – לא לשכוח', p: 'רישיון נהיגה ישראלי, רישיון נהיגה בינלאומי, כרטיס האשראי שאיתו הזמנתם את הרכב, ודרכון (כמובן).' },
  { ic: '🛣️', h: 'אוטוסטרדה', p: 'בכניסה לכביש המהיר אל תעלו על המסלול הצהוב (TELEPASS). קחו כרטיס בכניסה, ובַיציאה דאגו לשלם – כך תמנעו מדוחות.' },
  { ic: '🚫', h: 'פירנצה ו-ZTL', p: 'אם נכנסים עם רכב לפירנצה ליום אחד – אין סיבה לדאגה. החניון המוזכר נמצא מחוץ לאזור ה-ZTL ולא תסתכנו בקנס.' },
  { ic: '📱', h: 'דוחות ו-WAZE', p: 'השימוש ב-WAZE מניח את הדעת מהפחד לקבל קנס. הוא מתריע על דרכים בעייתיות ועל כניסה לאזורי ZTL, ומאפשר לעבור רק כשמותר.' },
  { ic: '⚡', h: 'מהירות', p: 'עד 130 קמ״ש בכבישים מהירים, 70–90 קמ״ש בדרכים שאינן מהירות / עירוניות. שימו לב להתראות ולמכמונות מהירות.' },
  { ic: '🌄', h: 'דרכים כפריות', p: 'שימו לב למהירות והיו מודעים אליה כל הזמן – בדרכים הכפריות שמים על זה דגש מאוד גדול.' },
  { ic: '🅿️', h: 'חניונים', p: 'שולחים לכם הרבה חניונים שחוסכים כאב ראש. אפשר לשלם במדחני החניה – במטבעות או בכרטיס אשראי.' },
]

export const TIPS_EN = [
  { ic: '🧳', h: 'Before you fly – don\'t forget', p: 'Israeli driving licence, international driving permit, the credit card used to book the car, and your passport.' },
  { ic: '🛣️', h: 'Motorway (Autostrada)', p: 'At the toll booth do NOT take the yellow TELEPASS lane. Take a ticket on entry and pay on exit to avoid fines.' },
  { ic: '🚫', h: 'Florence & ZTL zones', p: 'If you\'re driving into Florence for the day there\'s nothing to worry about. The car park we recommend is outside the ZTL zone — no fine risk.' },
  { ic: '📱', h: 'Fines & Waze', p: 'Using Waze takes the stress out of fines. It warns you about restricted roads and ZTL entries so you only drive where it\'s allowed.' },
  { ic: '⚡', h: 'Speed limits', p: 'Up to 130 km/h on motorways, 70–90 km/h on non-motorway / urban roads. Pay attention to signs and speed cameras.' },
  { ic: '🌄', h: 'Country roads', p: 'Watch your speed at all times — local police place particular emphasis on speed enforcement on rural roads.' },
  { ic: '🅿️', h: 'Car parks', p: 'We\'ve included plenty of car parks to save you the headache. Payment at the machine — coins or credit card.' },
]
