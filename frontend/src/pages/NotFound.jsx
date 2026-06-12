import { Link } from 'react-router-dom'
import { Home, Compass, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-bg isolate">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="aurora-blob w-[500px] h-[500px] -top-32 -left-32 bg-brand-500/25 animate-blob" />
        <div className="aurora-blob w-[400px] h-[400px] -bottom-32 -right-32 bg-indigo-500/20 animate-blob" style={{ animationDelay: '4s' }} />
      </div>
      <div className="absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div className="text-center max-w-md animate-fade-up">
        <div className="relative inline-block mb-8">
          <h1 className="text-[140px] sm:text-[180px] font-extrabold leading-none tracking-tighter">
            <span className="text-gradient bg-[length:200%_auto] animate-gradient-x">404</span>
          </h1>
          <div className="absolute -top-2 -right-4 w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow rotate-12 animate-pulse-soft">
            <Compass size={22} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">Page not found</h2>
        <p className="text-sm md:text-base text-text-tertiary mt-3 leading-relaxed">
          The page you're looking for doesn't exist, has been moved, or is temporarily unavailable. Let's get you back on track.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft size={15} />
            Go Back
          </button>
          <Link to="/" className="btn-primary">
            <Home size={15} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
