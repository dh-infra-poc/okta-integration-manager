import { Slide, type SlideProps } from '@/components/slide'
import { Eyebrow, Heading } from '@/components/typography'
import { cn } from '@/lib/utils'

export interface ContentSlideProps extends Omit<SlideProps, 'surface'> {
  /** Optional uppercase kicker above the heading. */
  eyebrow?: React.ReactNode
  /** Heading text — the red rule is drawn above it automatically. */
  heading: React.ReactNode
  /** Use the light-grey section band instead of white. */
  band?: boolean
}

/**
 * Content slide — white (or grey-band) background, black text, red confined to
 * the heading rule and any keyword/data point. Everything left-aligned.
 * This is the workhorse; keep red under ~15% of the surface.
 */
export function ContentSlide({
  eyebrow,
  heading,
  band = false,
  className,
  children,
  ...props
}: ContentSlideProps) {
  return (
    <Slide surface={band ? 'band' : 'white'} className={cn('gap-[3cqw]', className)} {...props}>
      <header className="flex flex-col gap-[1.4cqw]">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading rule>{heading}</Heading>
      </header>
      <div className="flex-1">{children}</div>
    </Slide>
  )
}
