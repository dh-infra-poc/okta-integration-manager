import { cn } from '@/lib/utils'

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The top navigation bar (usually a <NavBar>). */
  nav?: React.ReactNode
  /** Optional footer region. */
  footer?: React.ReactNode
  /**
   * Pin the shell to the viewport so `main` fills exactly the space left by the
   * nav and scrolls internally. Use for chat, split panes, and other
   * app-like screens. Defaults to false — the normal page-scroll behaviour.
   */
  fill?: boolean
}

/**
 * Full-height application frame: fixed nav on top, scrolling main region, optional
 * footer. White surface throughout — the app equivalent of a white content slide.
 */
export function AppShell({
  nav,
  footer,
  fill = false,
  className,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col bg-dh-white text-dh-ink',
        fill ? 'h-screen overflow-hidden' : 'min-h-screen',
        className,
      )}
      {...props}
    >
      {nav}
      <main className={cn('flex-1', fill && 'min-h-0')}>{children}</main>
      {footer}
    </div>
  )
}
