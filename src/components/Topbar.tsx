import { logo } from '../ui'

export default function Topbar({ title, sub }: { title: string; sub: string }) {
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
