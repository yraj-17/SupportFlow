import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  User,
  Mail,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  FileText,
} from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

const STATUSES = ['Open', 'In Progress', 'Closed']
const STATUS_STYLES = {
  Open: 'bg-blue-500 text-white border-blue-500 shadow-glow-sm shadow-blue-500/30',
  'In Progress': 'bg-amber-500 text-white border-amber-500 shadow-glow-sm shadow-amber-500/30',
  Closed: 'bg-emerald-500 text-white border-emerald-500 shadow-glow-sm shadow-emerald-500/30',
}

function formatDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relativeTime(ts) {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`
  return ''
}

export default function TicketDetail() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTicket = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ticketsApi.get(ticketId)
      setTicket(res.data)
      setNewStatus(res.data.status)
    } catch (err) {
      toast.error('Ticket not found or network error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchTicket() }, [fetchTicket])

  async function handleUpdate() {
    const payload = {}
    if (newStatus !== ticket.status) payload.status = newStatus
    if (newNote.trim()) payload.note = newNote.trim()

    if (!Object.keys(payload).length) {
      toast('No updates specified', { icon: 'ℹ️' })
      return
    }

    setSaving(true)
    try {
      await ticketsApi.update(ticketId, payload)
      toast.success('Ticket updated successfully')
      setNewNote('')
      await fetchTicket()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update ticket')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-36 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-2xl animate-pulse-soft" />
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Loader2 className="text-white animate-spin" size={22} />
          </div>
        </div>
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-text-tertiary">Loading ticket</span>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-red-500/10 p-4 rounded-2xl inline-block mb-4"><FileText size={32} className="text-red-500" /></div>
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Ticket Not Found</h2>
        <p className="text-sm text-text-tertiary mt-2 max-w-sm mx-auto leading-relaxed">We couldn't retrieve the ticket you requested. It may have been deleted or the ID is incorrect.</p>
        <div className="mt-6"><Link to="/dashboard" className="btn-primary inline-flex"><ArrowLeft size={15} />Go back to dashboard</Link></div>
      </div>
    )
  }

  const hasChanges = newStatus !== ticket.status || newNote.trim().length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-text-tertiary hover:text-brand-500 transition group animate-fade-down">
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        Back to Dashboard
      </Link>

      <div className="card p-6 md:p-8 animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="space-y-2.5 min-w-0">
            <span className="inline-flex font-mono text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-500/10 dark:bg-brand-500/15 px-3 py-1.5 rounded-lg border border-brand-500/20">{ticket.ticket_id}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight leading-tight">{ticket.subject}</h1>
          </div>
          <div className="flex gap-2 shrink-0"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 md:p-5 rounded-control bg-surface-2/60 border border-border">
          <InfoItem icon={User} label="Customer" value={ticket.customer_name} />
          <InfoItem icon={Mail} label="Email" value={ticket.customer_email} />
          <InfoItem icon={Calendar} label="Date Raised" value={formatDateTime(ticket.created_at)} />
          <InfoItem icon={Clock} label="Last Updated" value={formatDateTime(ticket.updated_at)} />
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="field-label flex items-center gap-1.5"><FileText size={11} />Issue Description</h3>
          <div className="bg-surface-2/60 p-5 rounded-control border border-border">
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      </div>

      <div className="card p-6 md:p-8 space-y-6 animate-fade-up delay-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center"><CheckCircle size={16} className="text-brand-500 dark:text-brand-300" /></div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Update Ticket State</h2>
        </div>

        <div className="space-y-2">
          <label className="field-label">Set Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => {
              const selected = newStatus === s
              return (
                <button key={s} type="button" onClick={() => setNewStatus(s)} className={`px-5 py-2.5 rounded-control text-sm font-bold border transition-all duration-200 active:scale-95 ${selected ? STATUS_STYLES[s] : 'bg-surface text-text-secondary border-border hover:border-brand-500 hover:text-text-primary'}`}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="field-label flex items-center gap-1.5"><MessageSquare size={11} />Add a Comment / Progress Note</label>
            <span className="text-[10px] font-bold text-text-muted tabular-nums">{newNote.length} chars</span>
          </div>
          <textarea rows={4} className="input resize-none" placeholder="Add update comments, internal notes, actions taken, or replies to the client…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={handleUpdate} disabled={saving || !hasChanges} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {saving ? 'Updating…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="card p-6 md:p-8 animate-fade-up delay-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center"><MessageSquare size={16} className="text-brand-500 dark:text-brand-300" /></div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Activity Log <span className="ml-2 text-xs font-bold text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-md">{ticket.notes.length}</span></h2>
        </div>

        {ticket.notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 rounded-full bg-brand-500/15 blur-2xl" />
              <div className="relative w-14 h-14 mx-auto rounded-2xl bg-surface-2 border border-border flex items-center justify-center"><MessageSquare size={22} className="text-text-tertiary" /></div>
            </div>
            <p className="text-sm font-bold text-text-primary">No activity yet</p>
            <p className="text-xs text-text-tertiary mt-1">Use the update form above to log progress comments.</p>
          </div>
        ) : (
          <div className="relative space-y-5 pl-8 ml-2">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/40 via-border to-transparent" />
            {ticket.notes.map((note, idx) => (
              <div key={note.id} className="relative group animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-gradient-brand ring-4 ring-surface shadow-glow-sm transition-transform duration-300 group-hover:scale-110" />
                <div className="bg-surface-2/60 p-4 md:p-5 rounded-control border border-border transition-all duration-300 group-hover:border-border-strong group-hover:shadow-card">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-brand text-white font-bold text-[10px] flex items-center justify-center shadow-glow-sm">AG</div>
                      <div className="leading-none">
                        <p className="text-xs font-bold text-text-primary">Agent Update</p>
                        {relativeTime(note.created_at) && <p className="text-[10px] text-text-muted font-semibold mt-0.5">{relativeTime(note.created_at)}</p>}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-text-tertiary flex items-center gap-1"><Clock size={10} />{formatDateTime(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center gap-1.5 text-text-muted"><Icon size={12} className="shrink-0" /><span className="text-[10px] font-bold uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-semibold text-text-primary truncate" title={value}>{value}</p>
    </div>
  )
}
