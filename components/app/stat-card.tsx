import { cn } from '@/lib/utils'

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The metric label (small, uppercase, muted). */
  label: React.ReactNode
  /** The headline figure — the red numeral, screen-scaled for dashboards. */
  value: React.ReactNode
  /** Optional short delta or note beneath the value. */
  hint?: React.ReactNode
}

/**
 * Dashboard stat tile — the app-scale counterpart to the slide `Stat`.
 * Uses rem sizes suited to a metrics grid. The numeral carries the red; the
 * label and hint stay monochrome so the accent stays scarce across the grid.
 */
export function StatCard({ label, value, hint, className, ...props }: StatCardProps) {
  return (
    <div className={cn('flex flex-col gap-2 border border-dh-ink/15 bg-dh-white p-6', className)} {...props}>
      <span className="text-xs font-[700] uppercase tracking-[0.12em] text-dh-muted">{label}</span>
      <span className="text-4xl font-[900] leading-none tracking-[-0.02em] text-dh-red sm:text-5xl">
        {value}
      </span>
      {hint ? <span className="text-sm font-[300] text-dh-ink">{hint}</span> : null}
    </div>
  )
}
