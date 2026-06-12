import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import toast from 'react-hot-toast'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'; else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) e.email = 'Email is required'; else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email address'
    if (!form.password) e.password = 'Password is required'; else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const passwordStrength = useMemo(() => {
    const p = form.password
    if (!p) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' }
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    const map = [
      { label: 'Too short', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-amber-500' },
      { label: 'Good', color: 'bg-emerald-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
      { label: 'Excellent', color: 'bg-emerald-600' },
    ]
    return { level: score, ...map[Math.min(score, 5)] }
  }, [form.password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({}); setLoading(true)
    const res = await signUp(form.name, form.email, form.password)
    setLoading(false)
    if (res && res.success) {
      toast.success(res.message)
      navigate('/verify-otp', { state: { email: form.email, test_otp: res.test_otp } })
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join SupportDesk in seconds. No credit card required." footer={<span>Already registered? <Link to="/login" className="font-bold text-brand-500 hover:text-brand-600 transition">Sign in here</Link></span>}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="field-label">Full Name</label>
          <div className="relative group"><User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" /><input type="text" required autoComplete="name" disabled={loading} className={`input pl-10 ${errors.name ? 'input-error' : ''}`} placeholder="Rahul Sharma" value={form.name} onChange={handleChange('name')} /></div>
          {errors.name && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 font-semibold mt-1 animate-fade-down"><AlertCircle size={12} />{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="field-label">Email Address</label>
          <div className="relative group"><Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" /><input type="email" required autoComplete="email" disabled={loading} className={`input pl-10 ${errors.email ? 'input-error' : ''}`} placeholder="rahul@example.com" value={form.email} onChange={handleChange('email')} /></div>
          {errors.email && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 font-semibold mt-1 animate-fade-down"><AlertCircle size={12} />{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="field-label">Password</label>
          <div className="relative group">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password" disabled={loading} className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`} placeholder="At least 6 characters" value={form.password} onChange={handleChange('password')} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2 transition" tabIndex={-1}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          {form.password && <div className="space-y-1.5 pt-1 animate-fade-down"><div className="flex gap-1">{[0,1,2,3,4].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength.level ? passwordStrength.color : 'bg-surface-3'}`} />)}</div><p className="text-[11px] font-semibold text-text-tertiary flex items-center gap-1.5">{passwordStrength.level >= 3 && <CheckCircle2 size={11} className="text-emerald-500" />}Password strength: <span className="text-text-primary">{passwordStrength.label}</span></p></div>}
          {errors.password && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 font-semibold mt-1 animate-fade-down"><AlertCircle size={12} />{errors.password}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-2">{loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}{loading ? 'Creating Account…' : 'Create Account'}</button>
        <p className="text-[11px] text-text-muted text-center leading-relaxed">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
      </form>
    </AuthShell>
  )
}
