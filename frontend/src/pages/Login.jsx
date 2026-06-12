import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) { setError('Please provide email and password'); return }
    setError(''); setLoading(true)
    const success = await login(form.email.trim(), form.password)
    setLoading(false)
    if (success) navigate('/dashboard')
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access your SupportDesk agent console." footer={<span>New to SupportDesk? <Link to="/signup" className="font-bold text-brand-500 hover:text-brand-600 transition">Create an account</Link></span>}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs rounded-control font-semibold flex items-center gap-2 animate-fade-down"><AlertCircle size={14} />{error}</div>}
        <div className="space-y-1.5">
          <label className="field-label">Email Address</label>
          <div className="relative group">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input type="email" required autoComplete="email" disabled={loading} className="input pl-10" placeholder="agent@example.com" value={form.email} onChange={handleChange('email')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="field-label">Password</label>
          <div className="relative group">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" disabled={loading} className="input pl-10 pr-11" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition" tabIndex={-1}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-2">{loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}{loading ? 'Signing In…' : 'Sign In'}</button>
      </form>
    </AuthShell>
  )
}
