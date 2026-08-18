import { cn } from '@/lib/utils'

export interface DeckProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Deck — vertical container for a sequence of slides.
 *
 * Constrains slides to a sensible presentation width and stacks them with
 * consistent gutters. Each `Slide` inside scales its own typography via
 * container queries, so a Deck reads correctly from mobile to wide desktop
 * without any media queries.
 */
export function Deck({ className, children, ...props }: DeckProps) {
  return (
    <div
      className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}
