import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Slide — the base 16:9 canvas every slide is built on.
 *
 * - Establishes the container-query context (`@container`) that the slide type
 *   scale (`.dh-title`, `.dh-body`, …) depends on, so text scales with the slide.
 * - Applies the ~8% margins from the spec via padding tokens.
 * - Flat colour only: no shadow, no radius.
 *
 * `surface` selects the background per the spec's slide patterns:
 *   red   → red-flood (title & section slides)
 *   white → content & stat slides (the default)
 *   band  → light-grey section band
 */
const slideVariants = cva(
  '@container relative w-full aspect-video overflow-hidden flex flex-col text-left',
  {
    variants: {
      surface: {
        red: 'bg-dh-red text-dh-white',
        white: 'bg-dh-white text-dh-ink',
        band: 'bg-dh-band text-dh-ink',
      },
      padded: {
        true: 'px-[var(--dh-margin-x)] py-[var(--dh-margin-y)]',
        false: '',
      },
    },
    defaultVariants: {
      surface: 'white',
      padded: true,
    },
  },
)

export interface SlideProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof slideVariants> {}

export function Slide({ className, surface, padded, children, ...props }: SlideProps) {
  return (
    <section className={cn(slideVariants({ surface, padded }), className)} {...props}>
      {children}
    </section>
  )
}
