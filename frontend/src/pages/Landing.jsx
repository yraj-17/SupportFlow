import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Headphones,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  MessageSquare,
  BarChart3,
  Users,
  Send,
  Star,
  FileText,
  HelpCircle,
  Mail,
  User,
  Sparkles,
  Shield,
  Zap,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ticketsApi } from '../api/tickets'
import ThemeToggle from '../components/ThemeToggle'
import toast from 'react-hot-toast'

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const [ticketLoading, setTicketLoading] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium',
  })

  const handleInputChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.subject.trim() || !form.description.trim()) {
      toast.error('Please fill out all required fields')
      return
    }

    setTicketLoading(true)
    try {
      const res = await ticketsApi.create(form)
      toast.success(`Support Ticket ${res.data.ticket_id} created successfully!`)
      setForm({ customer_name: '', customer_email: '', subject: '', description: '', priority: 'Medium' })
      if (isAuthenticated) {
        navigate(`/tickets/${res.data.ticket_id}`)
      } else {
        toast('Login to view full ticket details and add comment notes.', { icon: '🔑', duration: 6000 })
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit ticket')
    } finally {
      setTicketLoading(false)
    }
  }

  return (
    <div className="bg-bg text-text-primary font-sans selection:bg-brand-500/20 scroll-smooth">
      <nav className="sticky top-0 z-50 bg-bg/75 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm transition-transform group-hover:scale-105">
              <Headphones size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base tracking-tight text-gradient">SupportDesk</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '#features', label: 'Features' },
              { href: '#analytics', label: 'Analytics' },
              { href: '#testimonials', label: 'Reviews' },
              { href: '#contact', label: 'Support' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="px-3.5 py-2 text-sm font-semibold text-text-tertiary hover:text-text-primary transition-colors">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="hidden sm:flex" />
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/dashboard" className="btn-secondary !py-2 !px-4 !text-xs">Agent Console</Link>
                <button onClick={logout} className="btn-ghost !py-2 !px-3 !text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10">Log Out</button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-ghost !text-xs">Log In</Link>
                <Link to="/signup" className="btn-primary !py-2 !px-4 !text-xs">Get Started <ArrowRight size={13} /></Link>
              </div>
            )}
            <button onClick={() => setMobileNavOpen(true)} className="md:hidden p-2 rounded-lg text-text-tertiary hover:bg-surface-2" aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 bg-bg/95 backdrop-blur-xl z-50 md:hidden flex flex-col transition-all duration-300 ${mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm"><Headphones size={16} className="text-white" strokeWidth={2.5} /></div><span className="font-extrabold text-base text-gradient">SupportDesk</span></div>
          <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg text-text-tertiary hover:bg-surface-2"><X size={20} /></button>
        </div>
        <div className="flex-1 px-5 py-8 flex flex-col gap-2">
          {['#features', '#analytics', '#testimonials', '#contact'].map((href, i) => (
            <a key={href} href={href} onClick={() => setMobileNavOpen(false)} className="px-4 py-3 rounded-control text-base font-semibold text-text-secondary hover:bg-surface-2 transition">{['Features', 'Analytics', 'Reviews', 'Support'][i]}</a>
          ))}
          <div className="border-t border-border my-4" />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)} className="btn-secondary w-full">Agent Console</Link>
              <button onClick={() => { setMobileNavOpen(false); logout() }} className="btn-ghost w-full justify-center text-red-500">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileNavOpen(false)} className="btn-secondary w-full">Log In</Link>
              <Link to="/signup" onClick={() => setMobileNavOpen(false)} className="btn-primary w-full">Get Started <ArrowRight size={14} /></Link>
            </>
          )}
          <div className="mt-auto flex items-center justify-between px-1 py-2"><span className="text-xs font-semibold text-text-tertiary">Appearance</span><ThemeToggle /></div>
        </div>
      </div>

      <section className="relative overflow-hidden isolate">
        <div className="absolute inset-0 -z-10">
          <div className="aurora-blob w-[600px] h-[600px] -top-32 -left-32 bg-brand-500/30 animate-blob" />
          <div className="aurora-blob w-[500px] h-[500px] top-20 -right-32 bg-indigo-500/25 animate-blob" style={{ animationDelay: '3s' }} />
          <div className="aurora-blob w-[400px] h-[400px] bottom-0 left-1/3 bg-fuchsia-500/20 animate-blob" style={{ animationDelay: '6s' }} />
        </div>
        <div className="absolute inset-0 bg-grid opacity-40 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-7 text-left">
            <div className="inline-flex items-center gap-2 chip animate-fade-up"><Sparkles size={11} className="text-brand-500" /><span>Premium support operations</span></div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] animate-fade-up delay-100">
              Customer support,
              <br />
              <span className="text-gradient bg-[length:200%_auto] animate-gradient-x">reimagined.</span>
            </h1>
            <p className="text-base md:text-lg text-text-tertiary max-w-xl leading-relaxed animate-fade-up delay-200">
              A premium ticketing CRM for modern teams. Track issues, collaborate in real time, and resolve faster from one beautifully crafted workspace.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 animate-fade-up delay-300">
              <a href="#contact" className="btn-primary !px-6 !py-3">Raise a Support Ticket <ArrowRight size={15} /></a>
              <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn-secondary !px-6 !py-3">{isAuthenticated ? 'Open Dashboard' : 'Create Account'}</Link>
            </div>
            <div className="flex items-center gap-6 pt-4 text-xs text-text-tertiary animate-fade-up delay-400">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /><span className="font-semibold">Fast onboarding</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /><span className="font-semibold">Dark mode included</span></div>
            </div>
          </div>

          <div className="lg:col-span-6 relative animate-fade-up delay-300">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-2xl bg-gradient-brand opacity-20 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-2xl bg-indigo-500 opacity-20 blur-2xl" />
            <div className="relative card-glass rounded-large p-5 shadow-card-hover">
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
                <div className="bg-surface-2/70 text-[10px] font-mono text-text-tertiary px-3 py-1 rounded-md border border-border/40">supportdesk.crm/dashboard</div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Live</span>
              </div>

              <div className="grid grid-cols-3 gap-3 my-5">
                {[
                  { val: '142', label: 'Total', text: 'text-brand-600 dark:text-brand-300' },
                  { val: '18', label: 'Open', text: 'text-blue-600 dark:text-blue-300' },
                  { val: '98%', label: 'SLA', text: 'text-emerald-600 dark:text-emerald-300' },
                ].map((s) => (
                  <div key={s.label} className="relative bg-surface/60 border border-border/60 p-3 rounded-control overflow-hidden">
                    <p className={`relative text-xl font-extrabold leading-tight ${s.text}`}>{s.val}</p>
                    <p className="relative text-[9px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { id: 'TKT-042', subject: 'Payment gateway API keeps failing', name: 'Amit Kumar', status: 'In Progress', tag: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20', dot: 'bg-amber-500' },
                  { id: 'TKT-043', subject: 'Unable to download PDF statement', name: 'Sarah Jenkins', status: 'Open', tag: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20', dot: 'bg-blue-500' },
                  { id: 'TKT-041', subject: 'Mobile login not working on iOS', name: 'Rahul Sharma', status: 'Closed', tag: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20', dot: 'bg-emerald-500' },
                ].map((t) => (
                  <div key={t.id} className="group bg-surface/60 border border-border/50 p-3 rounded-control flex items-center justify-between transition-all duration-300 hover:border-brand-500/30 hover:bg-surface hover:shadow-glow-sm hover:-translate-y-0.5">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-text-primary truncate">{t.subject}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 font-medium">{t.id} · {t.name}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${t.tag}`}><span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/30 via-transparent to-indigo-950/30" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
          {[
            ['98.4%', 'SLA Resolution Rate'],
            ['4.9 / 5', 'Customer CSAT Score'],
            ['15 min', 'Avg Response Time'],
            ['3.5×', 'Team Velocity Boost'],
          ].map(([num, label]) => (
            <div key={label} className="space-y-2"><h4 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-300">{num}</h4><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">{label}</p></div>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-5 md:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="chip"><Zap size={11} /> Built for support pros</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Everything you need to <span className="text-gradient">resolve fast</span>.</h2>
          <p className="text-base text-text-tertiary leading-relaxed">Ticketing, customer context, collaboration, and analytics — unified in a workspace that feels premium on every screen.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          <FeatureCard icon={FileText} title="Create Tickets" description="Submit tickets instantly with clear issue summaries, detailed descriptions, and priority selection." />
          <FeatureCard icon={Search} title="Smart Search" description="Instantly filter across ticket IDs, subjects, names, and emails without leaving the page." />
          <FeatureCard icon={Clock} title="Status Tracking" description="Move requests through Open, In Progress, and Closed states with a clean operational flow." />
          <FeatureCard icon={Users} title="Team Collaboration" description="Agents can review history, add notes, and coordinate updates without breaking context." />
          <FeatureCard icon={MessageSquare} title="Activity Timeline" description="Every ticket includes a readable timeline of updates with precise timestamps." />
          <FeatureCard icon={BarChart3} title="Live Analytics" description="Track ticket volume, open queues, and resolution progress in one elegant dashboard." />
        </div>
      </section>

      <section id="analytics" className="py-24 bg-surface-2/40 border-y border-border px-5 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left space-y-5">
            <span className="chip"><BarChart3 size={11} /> Data visualization</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">Actionable support analytics, <span className="text-gradient">at a glance</span>.</h2>
            <p className="text-base text-text-tertiary leading-relaxed">Review ticket load, priority distribution, and operational bottlenecks in a dashboard optimized for clarity.</p>
            <ul className="space-y-3 pt-2">
              {['Live ticket count updates', 'Dynamic prioritization filters', 'Instant CSV exports for reporting', 'Dark mode designed for long support sessions'].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-semibold text-text-secondary"><div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><CheckCircle2 size={13} className="text-emerald-500" /></div>{item}</li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            {[
              ['Total Tickets', '142', '+12.4%', 'Overall customer queries'],
              ['Open Tickets', '18', '-4.2%', 'Awaiting agent action'],
              ['In Progress', '24', '+8.1%', 'Under active review'],
              ['Closed', '100', '+18.5%', 'Resolved successfully'],
            ].map(([label, val, percent, desc]) => (
              <div key={label} className="relative card card-hover p-5 overflow-hidden"><div className="relative flex justify-between items-center"><span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span><span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${percent.startsWith('+') ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-300' : 'text-red-600 bg-red-500/10 dark:text-red-300'}`}>{percent}</span></div><div className="relative flex items-baseline gap-2 mt-3"><p className="text-3xl font-extrabold text-text-primary leading-none tabular-nums">{val}</p><span className="text-[10px] text-text-muted font-semibold">tickets</span></div><p className="relative text-[11px] text-text-tertiary mt-3 pt-3 border-t border-border">{desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 px-5 md:px-8 max-w-7xl mx-auto space-y-14">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="chip"><Star size={11} /> Success stories</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Loved by <span className="text-gradient">support professionals</span>.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TestimonialCard name="Rahul Sharma" role="VP Customer Success, FinFlow" quote="SupportDesk changed our customer response dynamics. Average resolution time dropped dramatically within weeks." avatar="RS" />
          <TestimonialCard name="Sarah Jenkins" role="Operations Manager, TechLogix" quote="The polished interface, dark mode, and dynamic search make this CRM a delight to use every day." avatar="SJ" />
          <TestimonialCard name="Amit Patel" role="Founder, CloudScale" quote="Beautifully crafted and operationally clear. It feels like a real production product, not a prototype." avatar="AP" />
        </div>
      </section>

      <section id="contact" className="py-24 px-5 md:px-8 bg-surface-2/40 border-y border-border">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <span className="chip"><Send size={11} /> Get in touch</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Have an issue? <span className="text-gradient">Raise a ticket</span>.</h2>
            <p className="text-base text-text-tertiary max-w-md mx-auto">Submit your details below. The system instantly creates a record and issues you a unique Ticket ID.</p>
          </div>

          <form onSubmit={handleCreateTicket} className="card p-6 md:p-8 space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="field-label">Your Name</label><div className="relative"><User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input type="text" required placeholder="Enter your name" value={form.customer_name} onChange={handleInputChange('customer_name')} className="input pl-10" disabled={ticketLoading} /></div></div>
              <div className="space-y-1.5"><label className="field-label">Your Email</label><div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input type="email" required placeholder="you@example.com" value={form.customer_email} onChange={handleInputChange('customer_email')} className="input pl-10" disabled={ticketLoading} /></div></div>
            </div>
            <div className="space-y-1.5"><label className="field-label">Subject</label><div className="relative"><HelpCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input type="text" required placeholder="Summarize the issue…" value={form.subject} onChange={handleInputChange('subject')} className="input pl-10" disabled={ticketLoading} /></div></div>
            <div className="space-y-1.5"><label className="field-label">Describe the problem</label><textarea rows={5} required placeholder="Detail the issue, steps to reproduce, error codes, expected behavior…" value={form.description} onChange={handleInputChange('description')} className="input resize-none" disabled={ticketLoading} /></div>

            <div className="space-y-2">
              <label className="field-label">Priority level</label>
              <div className="flex gap-2 flex-wrap">
                {['Low', 'Medium', 'High'].map((p) => {
                  const selected = form.priority === p
                  const styles = {
                    High: 'bg-red-500 text-white border-red-500',
                    Medium: 'bg-orange-500 text-white border-orange-500',
                    Low: 'bg-slate-600 text-white border-slate-600',
                  }
                  return (
                    <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, priority: p }))} disabled={ticketLoading} className={`px-4 py-2 rounded-control text-xs font-bold border transition-all duration-200 active:scale-95 ${selected ? styles[p] : 'bg-surface text-text-secondary border-border hover:border-brand-500 hover:text-text-primary'}`}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end"><button type="submit" disabled={ticketLoading} className="btn-primary !px-6">{ticketLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}{ticketLoading ? 'Submitting…' : 'Submit Support Ticket'}</button></div>
          </form>
        </div>
      </section>

      <section className="relative py-24 px-5 md:px-8 overflow-hidden border-t border-border isolate">
        <div className="absolute inset-0 -z-10">
          <div className="aurora-blob w-[450px] h-[450px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500/20 animate-blob" />
          <div className="aurora-blob w-[400px] h-[400px] top-1/4 left-1/3 bg-indigo-500/15 animate-blob" style={{ animationDelay: '3s' }} />
          <div className="aurora-blob w-[350px] h-[350px] bottom-1/4 right-1/3 bg-fuchsia-500/15 animate-blob" style={{ animationDelay: '6s' }} />
        </div>
        <div className="absolute inset-0 bg-grid opacity-30 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

        <div className="relative max-w-4xl mx-auto text-center space-y-7">
          <span className="chip"><Shield size={11} /> Trusted by support teams</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-text-primary">
            Start managing customer support <span className="text-gradient">smarter</span>.
          </h2>
          <p className="text-base md:text-lg text-text-tertiary max-w-xl mx-auto leading-relaxed">
            Equip your team with search filters, timeline notes, live stats, and automated ticket generation today.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <Link to="/signup" className="btn-primary !px-6 !py-3">Create Agent Account</Link>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-secondary !px-6 !py-3">Explore Dashboard</Link>
          </div>
        </div>
      </section>

      <footer className="bg-bg border-t border-border py-14 px-5 md:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-12 gap-8">
          <div className="col-span-2 md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm"><Headphones size={16} className="text-white" strokeWidth={2.5} /></div><span className="font-extrabold text-base text-gradient">SupportDesk</span></div>
            <p className="max-w-xs text-text-tertiary leading-relaxed">Enterprise-grade customer support ticketing CRM. Built for startups, success leaders, and operations teams who care about craft.</p>
          </div>
          <div className="md:col-span-2 space-y-3"><h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Product</h5><ul className="space-y-2 text-text-tertiary"><li><a href="#features" className="hover:text-text-primary transition">Features</a></li><li><a href="#analytics" className="hover:text-text-primary transition">Analytics</a></li><li><Link to="/tickets/new" className="hover:text-text-primary transition">New Ticket</Link></li></ul></div>
          <div className="md:col-span-2 space-y-3"><h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Console</h5><ul className="space-y-2 text-text-tertiary"><li><Link to="/login" className="hover:text-text-primary transition">Log In</Link></li><li><Link to="/signup" className="hover:text-text-primary transition">Sign Up</Link></li><li><Link to="/dashboard" className="hover:text-text-primary transition">Dashboard</Link></li></ul></div>
          <div className="md:col-span-3 space-y-3"><h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Contact</h5><p className="text-text-tertiary">Support Center diagnostics & CRM</p><p className="font-semibold text-text-primary">support@supportdesk.crm</p></div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-text-muted"><p>© 2026 SupportDesk CRM. Crafted with care.</p><p>Privacy Policy · Service SLA · Terms</p></div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group relative h-full card card-hover p-6 overflow-hidden">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-brand opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500" />
      <div className="relative w-11 h-11 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 text-brand-500 dark:text-brand-300 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-gradient-brand group-hover:text-white group-hover:shadow-glow-sm group-hover:-rotate-3 group-hover:scale-105"><Icon size={19} strokeWidth={2.25} /></div>
      <h3 className="relative text-base font-bold text-text-primary mb-2">{title}</h3>
      <p className="relative text-sm text-text-tertiary leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({ name, role, quote, avatar }) {
  return (
    <div className="card card-hover p-6 h-full flex flex-col gap-4">
      <div className="flex items-center gap-0.5 text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
      <p className="text-sm text-text-secondary italic leading-relaxed flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-gradient-brand text-white font-bold text-xs flex items-center justify-center shadow-glow-sm">{avatar}</div>
        <div className="min-w-0"><p className="text-sm font-bold text-text-primary truncate">{name}</p><p className="text-[11px] text-text-muted truncate">{role}</p></div>
      </div>
    </div>
  )
}
