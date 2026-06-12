import { Loader2 } from 'lucide-react'

export default function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-2xl animate-pulse-soft" />
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Loader2 className="text-white animate-spin" size={22} />
          </div>
        </div>
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-text-tertiary">{label}</span>
      </div>
    </div>
  )
}
