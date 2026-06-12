import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Headphones } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()
  const navLink = (to, label, Icon) => {
    const active = pathname === to
    return (
      <Link to={to} className={`flex items-center gap-2 px-3 py-2 rounded-control text-sm font-semibold transition-all duration-200 ${active ? 'bg-gradient-brand text-white shadow-glow-sm' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'}`}>
        <Icon size={15} />
        {label}
      </Link>
    )
  }
  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-text-primary">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm"><Headphones size={14} className="text-white" /></div>
          <span className="text-gradient">SupportDesk</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLink('/', 'Dashboard', LayoutDashboard)}
          {navLink('/tickets/new', 'New Ticket', PlusCircle)}
        </nav>
      </div>
    </header>
  )
}
