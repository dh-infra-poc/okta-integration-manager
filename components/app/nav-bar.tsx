import { cn } from '@/lib/utils'
import { Container } from '@/components/app/container'
import { Wordmark } from '@/components/wordmark'

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page — draws the single red underline indicator. */
  active?: boolean
}

/**
 * A top-nav link. The active item is the only place red appears in the bar,
 * shown as a flat red underline — no pills, no filled tabs.
 */
export function NavLink({ active = false, className, children, ...props }: NavLinkProps) {
  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex h-16 items-center text-sm font-[700] uppercase tracking-[0.08em] transition-colors',
        active ? 'text-dh-ink' : 'text-dh-muted hover:text-dh-ink',
        className,
      )}
      {...props}
    >
      {children}
      {active ? (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-dh-red" />
      ) : null}
    </a>
  )
}

export interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Right-aligned actions (buttons, avatar, etc.). */
  actions?: React.ReactNode
}

/**
 * Application top bar: wordmark on the left, links in the middle, actions on the
 * right. Flat with a single hairline rule beneath — no shadow.
 */
export function NavBar({ actions, className, children, ...props }: NavBarProps) {
  return (
    <header className={cn('border-b border-dh-ink/10 bg-dh-white', className)} {...props}>
      <Container>
        <div className="flex h-16 items-center justify-between gap-8">
          <div className="flex items-center gap-10">
            <Wordmark tone="red" className="text-xl" />
            <nav className="hidden items-center gap-8 md:flex">{children}</nav>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </Container>
      {/*
        Below md the links move to their own row rather than vanishing. The row
        scrolls horizontally instead of wrapping, so the bar keeps its flat
        single-rule silhouette at any width. Links are shortened to h-12 here.
      */}
      <div className="border-t border-dh-ink/10 md:hidden">
        <Container>
          <nav className="-mx-1 flex items-center gap-6 overflow-x-auto px-1 [&>a]:h-12">
            {children}
          </nav>
        </Container>
      </div>
    </header>
  )
}
