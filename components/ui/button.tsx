import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Button — flat, square, and on-brand.
 *
 * No radius, no shadow, no gradient. `primary` spends the red; `outline` and
 * `ghost` stay monochrome so red never appears twice in the same control group.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-[700] uppercase tracking-[0.06em] transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-dh-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: 'bg-dh-red text-dh-white hover:bg-dh-red/90',
        outline: 'border border-dh-ink bg-transparent text-dh-ink hover:bg-dh-ink hover:text-dh-white',
        ghost: 'bg-transparent text-dh-ink hover:bg-dh-band',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
