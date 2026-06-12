import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  Inbox,
  PlusCircle,
  X,
  Filter,
} from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import StatsBar from '../components/StatsBar'
import { exportToCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

const STATUSES = ['All', 'Open', 'In Progress', 'Closed']
const PRIORITIES = ['All', 'High', 'Medium', 'Low']

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_200px_180px_110px_40px] gap-4 px-6 py-4 items-center">
      <div className="skeleton h-6 w-20" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-3 w-32 hidden md:block" />
      <div className="skeleton h-6 w-32 hidden md:block" />
      <div className="skeleton h-3 w-20 hidden md:block" />
      <div className="skeleton h-4 w-4 ml-auto hidden md:block" />
    </div>
  )
}

export default function Home() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [priority, setPriority] = useState('All')
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (status !== 'All') params.status = status
      if (priority !== 'All') params.priority = priority

      const [ticketsRes, statsRes] = await Promise.all([
        ticketsApi.list(params),
        ticketsApi.stats(),
      ])

      setTickets(ticketsRes.data)
      setStats(statsRes.data)
    } catch (err) {
      toast.error('Failed to load tickets. Please check server connection.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, status, priority])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })
  }, [tickets, sortOrder])

  const totalPages = Math.ceil(sortedTickets.length / pageSize)
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedTickets.slice(start, start + pageSize)
  }, [sortedTickets, currentPage])

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    toast.success(`Sorted by date: ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`)
  }

  const handleExport = () => {
    if (tickets.length === 0) {
      toast.error('No tickets found to export')
      return
    }
    exportToCSV(sortedTickets, `crm_tickets_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('CSV export downloaded')
  }

  const hasActiveFilters = search.trim() || status !== 'All' || priority !== 'All'
  const handleSearchChange = (e) => {
    setCurrentPage(1)
    setSearch(e.target.value)
  }
  const handleStatusChange = (value) => {
    setCurrentPage(1)
    setStatus(value)
  }
  const handlePriorityChange = (value) => {
    setCurrentPage(1)
    setPriority(value)
  }
  const clearFilters = () => {
    setCurrentPage(1)
    setSearch('')
    setStatus('All')
    setPriority('All')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="chip">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-brand-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Live
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">Support Tickets</h1>
          <p className="text-sm text-text-tertiary mt-1.5">Track, manage, and resolve customer support queries in real time.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={fetchData} className="btn-secondary !text-xs" title="Refresh tickets">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={handleExport} className="btn-secondary !text-xs" title="Export filtered tickets to CSV">
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <StatsBar stats={stats} />

      <div className="card p-4 sm:p-5 animate-fade-up delay-200">
        <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="relative flex-1 max-w-lg group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input
              type="text"
              className="input pl-10 pr-9"
              placeholder="Search by ID, customer, email, subject…"
              value={search}
              onChange={handleSearchChange}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <FilterPills label="Status" icon={SlidersHorizontal} options={STATUSES} value={status} onChange={handleStatusChange} />
            <FilterPills label="Priority" icon={Filter} options={PRIORITIES} value={priority} onChange={handlePriorityChange} />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border animate-fade-down">
            <p className="text-xs text-text-tertiary font-semibold">{tickets.length} matching record{tickets.length !== 1 ? 's' : ''}</p>
            <button onClick={clearFilters} className="text-xs font-bold text-brand-500 hover:text-brand-600 inline-flex items-center gap-1 transition">
              <X size={12} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden animate-fade-up delay-300">
        <div className="hidden md:grid grid-cols-[120px_1fr_200px_180px_110px_40px] gap-4 px-6 py-3.5 border-b border-border bg-surface-2/60 text-[11px] font-bold text-text-tertiary uppercase tracking-wider items-center">
          <span>Ticket ID</span>
          <span>Subject &amp; Customer</span>
          <span>Email</span>
          <span>Status / Priority</span>
          <button onClick={toggleSort} className="flex items-center gap-1.5 hover:text-brand-500 transition text-left font-bold">
            Created
            {sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
          </button>
          <span />
        </div>

        {loading ? (
          <div className="divide-y divide-border">{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>
        ) : paginatedTickets.length === 0 ? (
          <div className="py-20 text-center px-4 animate-fade-in">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full bg-brand-500/15 blur-2xl animate-pulse-soft" />
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
                <Inbox size={26} className="text-text-tertiary" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-primary">No tickets found</h3>
            <p className="text-sm text-text-tertiary max-w-sm mx-auto mt-2 leading-relaxed">
              {hasActiveFilters
                ? 'No tickets match your current filters. Try clearing them or adjusting your search.'
                : 'You have no support tickets yet. Create a new ticket to get started.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-secondary !text-xs">
                  <X size={13} />
                  Clear filters
                </button>
              )}
              <Link to="/tickets/new" className="btn-primary !text-xs">
                <PlusCircle size={14} />
                Create New Ticket
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedTickets.map((ticket, idx) => (
              <Link
                key={ticket.ticket_id}
                to={`/tickets/${ticket.ticket_id}`}
                className="group grid grid-cols-1 md:grid-cols-[120px_1fr_200px_180px_110px_40px] gap-3 md:gap-4 px-4 md:px-6 py-4 items-center hover:bg-surface-2/60 transition-colors duration-200 animate-fade-up"
                style={{ animationDelay: `${idx * 35}ms` }}
              >
                <div className="flex justify-between items-center md:block">
                  <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-300 bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/20 px-2.5 py-1 rounded-md inline-block">
                    {ticket.ticket_id}
                  </span>
                  <span className="md:hidden"><PriorityBadge priority={ticket.priority} /></span>
                </div>

                <div className="min-w-0 pr-3">
                  <p className="text-sm font-bold text-text-primary truncate group-hover:text-brand-500 dark:group-hover:text-brand-300 transition-colors">{ticket.subject}</p>
                  <p className="text-xs text-text-tertiary truncate mt-1">Raised by <span className="font-semibold text-text-secondary">{ticket.customer_name}</span></p>
                </div>

                <span className="text-xs text-text-tertiary truncate hidden md:block font-medium">{ticket.customer_email}</span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={ticket.status} />
                  <span className="hidden md:inline-flex"><PriorityBadge priority={ticket.priority} /></span>
                </div>

                <span className="text-xs text-text-tertiary font-medium hidden md:block">{formatDate(ticket.created_at)}</span>

                <div className="justify-self-end text-text-muted group-hover:text-brand-500 transition-colors hidden md:block">
                  <ChevronRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 animate-fade-up">
          <p className="text-xs font-semibold text-text-tertiary">
            Showing <span className="text-text-primary">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-text-primary">{Math.min(currentPage * pageSize, tickets.length)}</span> of <span className="text-text-primary">{tickets.length}</span> tickets
          </p>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-2 hover:text-text-primary hover:border-border-strong transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Previous page">
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => {
              const p = i + 1
              const active = currentPage === p
              return (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${active ? 'bg-gradient-brand text-white shadow-glow-sm' : 'bg-surface border border-border text-text-secondary hover:bg-surface-2 hover:text-text-primary hover:border-border-strong'}`}>
                  {p}
                </button>
              )
            })}

            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-2 hover:text-text-primary hover:border-border-strong transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Next page">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterPills({ label, icon: Icon, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5 shrink-0">
        <Icon size={12} />
        {label}
      </span>
      <div className="relative flex bg-surface-2 p-1 rounded-control border border-border">
        {options.map((opt) => {
          const active = value === opt
          return (
            <button key={opt} onClick={() => onChange(opt)} className={`relative z-10 px-3 py-1.5 rounded-small text-[11px] font-bold transition-all duration-200 ${active ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'}`}>
              {active && <span className="absolute inset-0 bg-surface rounded-small shadow-soft border border-border -z-10" />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
