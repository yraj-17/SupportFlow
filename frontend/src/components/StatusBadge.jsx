const STATUS_STYLES = {
  'Open': 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  'Closed': 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
}
const STATUS_DOTS = { 'Open': 'bg-blue-500', 'In Progress': 'bg-amber-500', 'Closed': 'bg-emerald-500' }
const PRIORITY_STYLES = {
  'High': 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  'Medium': 'bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20',
  'Low': 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
}
const PRIORITY_DOTS = { 'High': 'bg-red-500', 'Medium': 'bg-orange-500', 'Low': 'bg-slate-400' }

export function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className="relative flex h-1.5 w-1.5">
        {status === 'Open' && <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-blue-400" />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] || 'bg-slate-400'}`} />
      </span>
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`status-badge ${PRIORITY_STYLES[priority] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOTS[priority] || 'bg-slate-400'}`} />
      {priority}
    </span>
  )
}
