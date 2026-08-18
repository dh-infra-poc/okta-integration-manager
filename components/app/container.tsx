import { cn } from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max content width. `default` (6xl) suits most app screens; `narrow` for forms/reading. */
  width?: 'default' | 'narrow' | 'wide'
}

const widthClass: Record<NonNullable<ContainerProps['width']>, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
}

/**
 * Page content container — the app-screen counterpart to a slide's margins.
 *
 * Centers content and applies the generous horizontal gutters the brand calls
 * for. Content inside stays left-aligned; never center body copy.
 */
export function Container({ width = 'default', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-6 sm:px-8', widthClass[width], className)}
      {...props}
    />
  )
}
