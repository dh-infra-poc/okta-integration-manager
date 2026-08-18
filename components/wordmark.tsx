import { cn } from '@/lib/utils'

type WordmarkTone = 'red' | 'white' | 'black'

const toneClass: Record<WordmarkTone, string> = {
  red: 'text-dh-red',
  white: 'text-dh-white',
  black: 'text-dh-ink',
}

export interface WordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Colour of the wordmark. Use `white` on red-flood slides, `red` on white slides. */
  tone?: WordmarkTone
}

/**
 * Delivery Hero wordmark.
 *
 * The real corporate wordmark is set in Corpid Black Italic with a custom "i"
 * and "l". Corpid is licensed, so this renders the wordmark in the system's
 * substitute face (Fira Sans) at Black Italic weight — the same heavy italic
 * silhouette. It is text, not an invented logo mark.
 */
export function Wordmark({ tone = 'red', className, ...props }: WordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-baseline font-[900] italic tracking-[-0.02em] lowercase',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      delivery hero
      <span className={cn('not-italic', tone === 'white' ? 'text-dh-white' : 'text-dh-red')}>
        .
      </span>
    </span>
  )
}
