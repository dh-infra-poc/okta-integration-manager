import { cn } from '@/lib/utils'

export interface PageHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Small uppercase red kicker above the title. */
  eyebrow?: React.ReactNode
  /** The heading text (Heavy weight). */
  title: React.ReactNode
  /** Optional supporting line (Light weight, muted). */
  description?: React.ReactNode
  /** Right-aligned actions, e.g. a primary button. */
  actions?: React.ReactNode
  /** Draw the signature red rule above the title. Defaults to true. */
  rule?: boolean
}

/**
 * Screen-scale section/page heading — the app counterpart to slide `Heading`.
 * Uses rem sizes (not slide `cqw`) and carries the red heading rule.
 */
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  rule = true,
  className,
  ...props
}: PageHeadingProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
      {...props}
    >
      <div className="flex flex-col gap-3">
        {rule ? <span aria-hidden className="h-1 w-12 bg-dh-red" /> : null}
        {eyebrow ? (
          <p className="text-xs font-[700] uppercase tracking-[0.16em] text-dh-red">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-[900] leading-[1.05] tracking-[-0.02em] text-dh-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-[60ch] text-base font-[300] leading-relaxed text-dh-ink">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  )
}
