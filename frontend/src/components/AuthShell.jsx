import { Link } from 'react-router-dom'
import { Headphones, ArrowLeft } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-bg overflow-hidden isolate">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="aurora-blob w-[500px] h-[500px] -top-32 -left-32 bg-brand-500/25 animate-blob" />
        <div className="aurora-blob w-[400px] h-[400px] top-1/3 -right-32 bg-indigo-500/20 animate-blob" style={{ animationDelay: '4s' }} />
        <div className="aurora-blob w-[450px] h-[450px] -bottom-32 left-1/4 bg-fuchsia-500/15 animate-blob" style={{ animationDelay: '8s' }} />
      </div>
      <div className="absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="px-5 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-text-primary transition group">
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
        <ThemeToggle variant="icon" />
      </div>

      <main className="flex-1 flex items-center justify-center px-5 py-8 md:py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow transition-transform group-hover:scale-105 group-hover:rotate-3">
                <Headphones size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-gradient">SupportDesk</span>
            </Link>
            <h1 className="mt-8 text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight">{title}</h1>
            {subtitle && <p className="mt-3 text-sm text-text-tertiary leading-relaxed max-w-xs mx-auto">{subtitle}</p>}
          </div>

          <div className="card-glass rounded-large p-7 md:p-8 shadow-card-hover">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-text-tertiary">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
