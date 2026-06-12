import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Headphones, Menu, X, ShieldCheck, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/verify-otp', '/tickets/new']
const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets/new', label: 'New Ticket', icon: PlusCircle },
]

function getInitials(name) {
  if (!name) return 'AG'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

function SidebarBrand({ onClick }) {
  return (
    <Link to="/dashboard" onClick={onClick} className="flex items-center gap-2.5 group">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
        <Headphones size={16} className="text-white relative" strokeWidth={2.5} />
      </div>
      <div className="leading-none">
        <p className="font-extrabold text-base tracking-tight text-gradient">SupportDesk</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-muted mt-0.5">Agent Console</p>
      </div>
    </Link>
  )
}

function NavList({ pathname, onItemClick }) {
  const isActive = (path) => (path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path))

  return (
    <nav className="flex-1 px-3 py-5 space-y-1">
      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Workspace</p>
      {NAV_LINKS.map((link, i) => {
        const active = isActive(link.to)
        const Icon = link.icon

        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onItemClick}
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-sidebar-item text-sm font-semibold transition-all duration-200 animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className={`absolute inset-0 rounded-sidebar-item transition-all duration-300 ${active ? 'bg-gradient-brand shadow-glow-sm' : 'bg-transparent group-hover:bg-surface-2'}`} />
            {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-brand shadow-glow-sm" />}
            <Icon size={17} strokeWidth={2.2} className={`relative shrink-0 transition-colors ${active ? 'text-white' : 'text-text-tertiary group-hover:text-text-primary'}`} />
            <span className={`relative flex-1 transition-colors ${active ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`}>{link.label}</span>
            <ChevronRight size={14} className={`relative transition-all ${active ? 'text-white/70 translate-x-0 opacity-100' : 'text-text-muted -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooter({ onLogout }) {
  return (
    <div className="p-4 border-t border-border space-y-3">
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Appearance</span>
        <ThemeToggle />
      </div>
      <button onClick={onLogout} className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-control text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors duration-200">
        <LogOut size={14} strokeWidth={2.4} />
        <span>Log Out</span>
      </button>
      <div className="flex items-center gap-2 px-2 pt-1 text-[10px] text-text-muted">
        <ShieldCheck size={11} className="text-brand-500" />
        <span className="font-semibold tracking-wide">Agent Console · v1.0</span>
      </div>
    </div>
  )
}

export default function MainLayout({ children }) {
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const agentName = user?.name || 'Support Agent'
  const agentInitials = getInitials(agentName)
  const agentEmail = user?.email || 'agent@supportdesk.crm'

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (isPublicRoute) return <>{children}</>

  const closeMobileSidebar = () => setMobileSidebarOpen(false)
  const handleMobileLogout = () => {
    closeMobileSidebar()
    logout()
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary flex">
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <SidebarBrand />
        </div>
        <NavList pathname={pathname} />
        <SidebarFooter onLogout={logout} />
      </aside>

      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileSidebar}
      />

      <aside className={`fixed inset-y-0 left-0 w-72 bg-surface border-r border-border z-50 md:hidden flex flex-col transform transition-transform duration-300 ease-spring ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <SidebarBrand onClick={closeMobileSidebar} />
          <button onClick={closeMobileSidebar} className="p-1.5 rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <NavList pathname={pathname} onItemClick={closeMobileSidebar} />
        <SidebarFooter onLogout={handleMobileLogout} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-all duration-300 ${scrolled ? 'bg-surface/85 backdrop-blur-xl border-b border-border shadow-soft' : 'bg-surface/40 backdrop-blur-md border-b border-transparent'}`}>
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-2 -ml-2 rounded-xl text-text-tertiary hover:bg-surface-2 hover:text-text-primary md:hidden transition" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <nav className="flex items-center gap-2 text-sm">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">CRM</span>
              <ChevronRight size={12} className="text-text-muted" />
              <span className="font-semibold text-text-secondary capitalize truncate max-w-[40vw]">{pathname === '/dashboard' ? 'Dashboard' : pathname.split('/').filter(Boolean).join(' / ')}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {pathname !== '/tickets/new' && (
              <Link to="/tickets/new" className="hidden sm:inline-flex btn-primary !py-2 !px-4 !text-xs">
                <PlusCircle size={14} strokeWidth={2.4} />
                <span className="hidden lg:inline">Create Ticket</span>
                <span className="lg:hidden">New</span>
              </Link>
            )}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-border">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center font-bold text-[11px] text-white shadow-glow-sm ring-2 ring-surface">{agentInitials}</div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-text-primary truncate max-w-[160px]">{agentName}</p>
                <p className="text-[10px] text-text-muted truncate max-w-[160px]">{agentEmail}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
