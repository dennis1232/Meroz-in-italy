import { useEffect, useState } from "react";
import { days, meta, currentTripId, initTrip } from "../store";
import { ddmm } from "../types";
import { applyTripPwa } from "../pwaManifest";
import { isStandalone, type Tab } from "../ui";
import TabBar from "./components/TabBar";
import IntroModal from "./components/IntroModal";
import Overview from "./components/Overview";
import Itinerary from "./components/Itinerary";
import MapScreen from "./components/MapScreen";
import MustSee from "./components/MustSee";
import More from "./components/More";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [targetDay, setTargetDay] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [tripVer, setTripVer] = useState(0);

  useEffect(() => {
    const ch = new BroadcastChannel(`meroz-trip-${currentTripId}`);
    ch.onmessage = (e) => {
      initTrip(e.data);
      applyTripPwa(currentTripId, meta);
      setTripVer((v) => v + 1);
    };
    return () => ch.close();
  }, []);

  useEffect(() => {
    applyTripPwa(currentTripId, meta);
  }, [tripVer]);

  useEffect(() => {
    let introSeen = false
    try { introSeen = !!localStorage.getItem('meroz_intro_seen') } catch { /* Safari private mode */ }
    if (!isStandalone && !introSeen) setShowIntro(true);
    const tds = ddmm(new Date().toISOString().slice(0, 10));
    const today = days.find((d) => d.date === tds);
    if (today) {
      setTargetDay(today.n);
      setTab("trip");
    }
    // Chrome (Android/desktop) fires this when the app is installable — capture for a 1-tap install
    const onPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstallPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const goToDay = (n: number) => {
    setTargetDay(n);
    setTab("trip");
  };
  const goTab = (t: Tab) => {
    if (t !== "trip") setTargetDay(null);
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app" dir={meta.lang === 'en' ? 'ltr' : 'rtl'}>
      {tab === "home" && <Overview key={tripVer} goToDay={goToDay} />}
      {tab === "trip" && <Itinerary key={tripVer} targetDay={targetDay} />}
      {tab === "map" && <MapScreen key={tripVer} />}
      {tab === "see" && <MustSee key={tripVer} />}
      {tab === "more" && <More openIntro={() => setShowIntro(true)} />}

      <TabBar tab={tab} onTab={goTab} />

      {showIntro && (
        <IntroModal
          onClose={() => setShowIntro(false)}
          installPrompt={installPrompt}
          onInstalled={() => setInstallPrompt(null)}
        />
      )}
    </div>
  );
}
