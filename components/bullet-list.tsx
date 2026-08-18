import { cn } from '@/lib/utils'

export interface BulletListProps extends React.HTMLAttributes<HTMLUListElement> {
  items: React.ReactNode[]
}

/**
 * Left-aligned bullet list with flat red square markers.
 *
 * Uses the red marker as a restrained accent — well within the ~15% red budget
 * on a white slide. No icon zoo, no rounded chips.
 */
export function BulletList({ items, className, ...props }: BulletListProps) {
  return (
    <ul className={cn('flex flex-col gap-[1.8cqw]', className)} {...props}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-[1.8cqw]">
          <span
            aria-hidden
            className="mt-[0.7cqw] size-[1.1cqw] shrink-0 bg-dh-red"
          />
          <span className="dh-body">{item}</span>
        </li>
      ))}
    </ul>
  )
}
