import { Slide, type SlideProps } from '@/components/slide'
import { cn } from '@/lib/utils'

export interface SectionDividerProps extends Omit<SlideProps, 'surface'> {
  /** Section number, e.g. "01". Rendered large in white. */
  number: React.ReactNode
  /** Section label. */
  label: React.ReactNode
}

/**
 * Section divider — full red, number + label in white.
 * Used as a rhythm marker between content runs.
 */
export function SectionDivider({
  number,
  label,
  className,
  ...props
}: SectionDividerProps) {
  return (
    <Slide surface="red" className={cn('justify-end gap-[2cqw]', className)} {...props}>
      <span className="dh-stat text-dh-white/40">{number}</span>
      <div className="flex flex-col gap-[1.2cqw]">
        <span aria-hidden className="h-[0.5cqw] w-[7cqw] bg-dh-white" />
        <h2 className="dh-section text-dh-white max-w-[24ch]">{label}</h2>
      </div>
    </Slide>
  )
}
