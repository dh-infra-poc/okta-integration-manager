import { cn } from '@/lib/utils'

/**
 * Typography primitives for the slide system.
 *
 * All sizes come from the `.dh-*` classes in globals.css, which are expressed
 * in container-query units so they scale with the slide. Never hard-code font
 * sizes — compose these instead.
 */

/** Small uppercase label above a heading (e.g. a section kicker). */
export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('dh-eyebrow text-dh-red', className)} {...props} />
}

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Draw the signature red rule above the heading (content-slide pattern). */
  rule?: boolean
}

/** Section heading (Heavy weight). Optionally preceded by the red heading rule. */
export function Heading({ rule = false, className, children, ...props }: HeadingProps) {
  return (
    <div className="flex flex-col gap-[1.6cqw]">
      {rule ? <span aria-hidden className="h-[0.5cqw] w-[7cqw] bg-dh-red" /> : null}
      <h2 className={cn('dh-section text-dh-ink', className)} {...props}>
        {children}
      </h2>
    </div>
  )
}

/** Title (Black weight) — used on red-flood title slides. */
export function Title({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn('dh-title', className)} {...props} />
}

/** Body copy (Light weight). Always left-aligned; never centered. */
export function Body({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('dh-body max-w-[64ch]', className)} {...props} />
}

/** Caption / footnote in the muted grey. */
export function Caption({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('dh-caption text-dh-muted', className)} {...props} />
}

/**
 * Inline keyword emphasis — the one red word in a line of black text.
 * This is the sanctioned way to spend the small red budget on a content slide.
 */
export function Keyword({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-dh-red font-[800]', className)} {...props} />
}
