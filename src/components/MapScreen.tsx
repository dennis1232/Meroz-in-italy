import { useState } from 'react'
import { days, type Stop } from '../data'
import Map from '../Map'
import Topbar from './Topbar'
import { colorFor } from '../ui'

export default function MapScreen() {
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
