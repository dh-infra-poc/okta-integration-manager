import { cn } from '@/lib/utils'

/**
 * Form controls — flat and square, with an ink border and a red focus ring.
 * Red only ever appears on focus; the resting state stays monochrome.
 */

const controlBase =
  'w-full border border-dh-ink/25 bg-dh-white px-3 py-2.5 text-base font-[300] text-dh-ink placeholder:text-dh-muted outline-none transition-colors focus-visible:border-dh-red focus-visible:ring-2 focus-visible:ring-dh-red/40 disabled:cursor-not-allowed disabled:opacity-50'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, 'h-11', className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, 'min-h-24 resize-y', className)} {...props} />
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-[700] uppercase tracking-[0.1em] text-dh-ink', className)}
      {...props}
    />
  )
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Field label text. */
  label?: React.ReactNode
  /** Associates the label with the control. */
  htmlFor?: string
  /** Helper or error text shown beneath the control. */
  hint?: React.ReactNode
  /** Renders the hint in red as an error. */
  error?: boolean
}

/**
 * A labelled field wrapper: label on top, control (as children) in the middle,
 * optional hint beneath. Everything left-aligned.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error = false,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hint ? (
        <p className={cn('text-xs font-[300]', error ? 'text-dh-red' : 'text-dh-muted')}>{hint}</p>
      ) : null}
    </div>
  )
}
