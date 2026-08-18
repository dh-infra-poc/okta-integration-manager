import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Badge / tag — flat and square. `red` spends the accent for the one status that
 * matters; `neutral` and `outline` stay monochrome so red is never diluted.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-xs font-[700] uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        red: 'bg-dh-red text-dh-white',
        neutral: 'bg-dh-band text-dh-ink',
        outline: 'border border-dh-ink/30 bg-transparent text-dh-ink',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
