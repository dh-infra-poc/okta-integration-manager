import { cn } from '@/lib/utils'

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The headline figure, e.g. "100+" or "3.2x". Rendered as a huge red numeral. */
  value: React.ReactNode
  /** Short black caption beneath the numeral. */
  label?: React.ReactNode
}

/**
 * A single oversized red statistic with a short black caption.
 *
 * This is the whole point of a stat slide: one huge numeral doing the talking.
 * The numeral is the red; keep the caption black.
 */
export function Stat({ value, label, className, ...props }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-[1.2cqw]', className)} {...props}>
      <span className="dh-stat text-dh-red">{value}</span>
      {label ? <span className="dh-body text-dh-ink max-w-[36ch]">{label}</span> : null}
    </div>
  )
}
