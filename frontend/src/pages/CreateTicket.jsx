import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, AlertCircle, User, Mail, HelpCircle, FileText, Sparkles } from 'lucide-react'
import { ticketsApi } from '../api/tickets'
import toast from 'react-hot-toast'

const PRIORITIES = ['Low', 'Medium', 'High']

export default function CreateTicket() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium',
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required'
    else if (form.customer_name.trim().length > 100) e.customer_name = 'Name must be 100 characters or less'

    if (!form.customer_email.trim()) e.customer_email = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(form.customer_email)) e.customer_email = 'Please enter a valid email address'

    if (!form.subject.trim()) e.subject = 'Issue subject is required'
    else if (form.subject.trim().length > 200) e.subject = 'Subject must be 200 characters or less'

    if (!form.description.trim()) e.description = 'Issue description is required'
    else if (form.description.trim().length > 5000) e.description = 'Description must be 5000 characters or less'

    return e
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      toast.error('Please fix the errors in the form')
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await ticketsApi.create(form)
      toast.success(`Support Ticket ${res.data.ticket_id} created successfully!`)
      navigate(`/tickets/${res.data.ticket_id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit support ticket')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const PRIORITY_STYLES = {
    High: 'bg-red-500 text-white border-red-500 shadow-glow-sm shadow-red-500/30',
    Medium: 'bg-orange-500 text-white border-orange-500 shadow-glow-sm shadow-orange-500/30',
    Low: 'bg-slate-600 text-white border-slate-600',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-text-tertiary hover:text-brand-500 transition group animate-fade-down">
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        Back to Dashboard
      </Link>

      <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-7 animate-fade-up">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-brand items-center justify-center shadow-glow-sm shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">New Support Ticket</h1>
            <p className="text-sm text-text-tertiary mt-1.5 leading-relaxed">
              Fill in the customer information and detail the technical problem to open a new CRM record.
            </p>
          </div>
        </div>

        <div className="space-y-5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldText label="Customer Name" field="customer_name" icon={User} placeholder="Raj Yadav" required maxLength={100} form={form} setForm={set} error={errors.customer_name} loading={loading} />
            <FieldText label="Customer Email" field="customer_email" type="email" icon={Mail} placeholder="rajyadav@example.com" required form={form} setForm={set} error={errors.customer_email} loading={loading} />
          </div>

          <FieldText label="Issue Subject" field="subject" icon={HelpCircle} placeholder="e.g. Cannot connect database to server dashboard" required maxLength={200} form={form} setForm={set} error={errors.subject} loading={loading} />

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="field-label flex items-center gap-1.5"><FileText size={11} />Detailed Description <span className="text-red-500 font-bold">*</span></label>
              <span className="text-[10px] font-bold text-text-muted tabular-nums">{form.description.length}/5000</span>
            </div>
            <textarea rows={7} maxLength={5000} className={`input resize-none ${errors.description ? 'input-error' : ''}`} placeholder="Describe the issue in detail. Please provide steps to reproduce, errors encountered, expected results…" value={form.description} onChange={set('description')} disabled={loading} />
            {errors.description && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1 font-semibold animate-fade-down"><AlertCircle size={12} />{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <label className="field-label">Priority Level</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => {
                const selected = form.priority === p
                return (
                  <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, priority: p }))} disabled={loading} className={`px-5 py-2.5 rounded-control text-sm font-bold border transition-all duration-200 active:scale-95 ${selected ? PRIORITY_STYLES[p] : 'bg-surface text-text-secondary border-border hover:border-brand-500 hover:text-text-primary'}`}>
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Link to="/dashboard" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {loading ? 'Submitting…' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FieldText({ label, field, icon: Icon, type = 'text', placeholder, required, maxLength, form, setForm, error, loading }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="field-label flex items-center gap-1.5">{Icon && <Icon size={11} />}{label} {required && <span className="text-red-500 font-bold">*</span>}</label>
        {maxLength && <span className="text-[10px] font-bold text-text-muted tabular-nums">{form[field].length}/{maxLength}</span>}
      </div>
      <div className="relative group">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />}
        <input type={type} maxLength={maxLength} className={`input ${Icon ? 'pl-10' : ''} ${error ? 'input-error' : ''}`} placeholder={placeholder} value={form[field]} onChange={setForm(field)} disabled={loading} />
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1 font-semibold animate-fade-down"><AlertCircle size={12} />{error}</p>}
    </div>
  )
}
