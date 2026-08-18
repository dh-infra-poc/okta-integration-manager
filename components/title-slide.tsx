import { Slide, type SlideProps } from '@/components/slide'
import { Title } from '@/components/typography'
import { Wordmark } from '@/components/wordmark'
import { cn } from '@/lib/utils'

export interface TitleSlideProps extends Omit<SlideProps, 'surface' | 'title'> {
  /** White Black-weight headline. */
  title: React.ReactNode
  /** Optional subtitle in lighter weight. */
  subtitle?: React.ReactNode
}

/**
 * Title slide — full-bleed red, white Black-weight headline, logo bottom-left.
 * Big type, lots of air. The opening beat of the red/white rhythm.
 */
export function TitleSlide({
  title,
  subtitle,
  className,
  ...props
}: TitleSlideProps) {
  return (
    <Slide surface="red" className={cn('justify-between', className)} {...props}>
      <div className="flex flex-1 flex-col justify-center gap-[2.5cqw]">
        <Title className="text-dh-white max-w-[18ch]">{title}</Title>
        {subtitle ? (
          <p className="dh-body text-dh-white/85 max-w-[52ch]">{subtitle}</p>
        ) : null}
      </div>
      <Wordmark tone="white" className="text-[2.4cqw]" />
    </Slide>
  )
}
