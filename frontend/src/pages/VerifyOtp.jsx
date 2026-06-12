import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, ArrowRight, Loader2, ShieldCheck, AlertCircle, Copy, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'

const OTP_LENGTH = 6

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyOtp } = useAuth()
  const prefilledEmail = location.state?.email || ''
  const prefilledOtp = location.state?.test_otp || ''
  const [email, setEmail] = useState(prefilledEmail)
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [testOtp] = useState(prefilledOtp)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const otpCode = digits.join('')

  const handleDigitChange = (idx, value) => {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = v
    setDigits(next)
    if (v && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
    else if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus()
    else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((d, i) => {
      if (i < OTP_LENGTH) next[i] = d
    })
    setDigits(next)
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[lastFilled]?.focus()
  }

  const copyTestOtp = async () => {
    try {
      await navigator.clipboard.writeText(testOtp)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      console.error('Failed to copy OTP:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setError('')
    setLoading(true)
    const success = await verifyOtp(email.trim(), otpCode)
    setLoading(false)
    if (success) navigate('/login')
  }

  const emailLocked = !!prefilledEmail

  return (
    <AuthShell
      title="Verify your account"
      subtitle="We've generated a 6-digit verification code to confirm your identity."
      footer={<Link to="/signup" className="font-semibold text-text-tertiary hover:text-text-primary transition">← Back to sign up</Link>}
    >
      <div className="space-y-5">
        {testOtp ? (
          <div className="relative p-4 rounded-control border bg-emerald-500/10 border-emerald-500/30 animate-fade-down">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Sandbox Test Mode</span>
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80 mb-2.5 leading-relaxed">Your verification code was generated successfully:</p>
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold text-lg tracking-[0.4em] text-emerald-900 dark:text-emerald-100 bg-emerald-500/15 rounded-control py-1.5 px-3.5 select-all">{testOtp}</code>
              <button onClick={copyTestOtp} className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 transition" title="Copy code" type="button">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-control border bg-amber-500/10 border-amber-500/30 animate-fade-down">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Verification Required</span>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-200/80 leading-relaxed">Please check the terminal / backend logs for the 6-digit OTP code.</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="field-label">Email Address</label>
            <div className="relative group">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />
              <input
                type="email"
                required
                disabled={loading || emailLocked}
                className="input pl-10"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="field-label">6-Digit Verification Code</label>
            <div className="flex gap-2 sm:gap-2.5 justify-between" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={loading}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-11 h-12 sm:w-12 sm:h-14 rounded-control border-2 text-center text-xl font-bold font-mono text-text-primary bg-surface focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all duration-200 ${d ? 'border-brand-500/60 bg-brand-500/[0.04]' : 'border-border hover:border-border-strong'} ${error ? 'border-red-400 dark:border-red-500/60' : ''} disabled:opacity-50`}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 font-semibold mt-2 animate-fade-down"><AlertCircle size={12} />{error}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>
      </div>
    </AuthShell>
  )
}
