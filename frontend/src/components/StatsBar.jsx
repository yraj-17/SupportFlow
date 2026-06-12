import { useEffect, useState } from 'react'
import { Ticket, CircleDot, Clock, CheckCircle2 } from 'lucide-react'

const CARDS = [
  { key: 'total', label: 'Total Tickets', icon: Ticket, iconBg: 'bg-brand-500/10 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300' },
  { key: 'open', label: 'Open', icon: CircleDot, iconBg: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/15 dark:text-blue-300' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300' },
]

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === undefined || target === null) return
    const start = performance.now()
    const to = Number(target) || 0
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => raf && cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

function StatCard({ idx, card, value }) {
  const display = useCountUp(typeof value === 'number' ? value : 0)
  const Icon = card.icon
  return (
    <div className="card card-hover p-5 flex items-center gap-4 group relative overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 opacity-[0.07] blur-2xl group-hover:opacity-[0.14] transition-opacity duration-500" />
      <div className={`relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${card.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
        <Icon size={20} strokeWidth={2.25} />
      </div>
      <div className="relative min-w-0">
        <p className="text-2xl font-extrabold text-text-primary leading-none tabular-nums tracking-tight">{value === undefined || value === null ? '—' : display}</p>
        <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mt-1.5">{card.label}</p>
      </div>
    </div>
  )
}

export default function StatsBar({ stats }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{CARDS.map((card, idx) => <StatCard key={card.key} idx={idx} card={card} value={stats?.[card.key]} />)}</div>
}
