import { Slide, type SlideProps } from '@/components/slide'
import { Stat } from '@/components/stat'
import { Eyebrow } from '@/components/typography'
import { cn } from '@/lib/utils'

export interface StatSlideProps extends Omit<SlideProps, 'surface'> {
  /** Optional uppercase kicker. */
  eyebrow?: React.ReactNode
  /** The huge red numeral, e.g. "100+". */
  value: React.ReactNode
  /** Short black caption beneath the numeral. */
  caption?: React.ReactNode
}

/**
 * Stat slide — one huge red numeral on white with a short black caption.
 * The single loudest slide type; use it sparingly for the number that matters.
 */
export function StatSlide({
  eyebrow,
  value,
  caption,
  className,
  ...props
}: StatSlideProps) {
  return (
    <Slide surface="white" className={cn('justify-center gap-[2cqw]', className)} {...props}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Stat value={value} label={caption} />
    </Slide>
  )
}
