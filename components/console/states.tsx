import { Card } from "@/components/app/card"
import { cn } from "@/lib/utils"

/** Shown when an upstream call failed — states the reason plainly. */
export function ErrorNotice({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border-dh-red/40 p-6">
      <div className="flex flex-col gap-2">
        <span className="h-1 w-10 bg-dh-red" aria-hidden />
        <h3 className="text-base font-[800] text-dh-ink">{title}</h3>
        <p className="max-w-[70ch] text-sm font-[300] leading-relaxed text-dh-ink">{message}</p>
      </div>
    </Card>
  )
}

/** Shown when a list is legitimately empty. */
export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("border border-dashed border-dh-ink/20 p-8", className)}>
      <p className="text-sm font-[300] text-dh-muted">{message}</p>
    </div>
  )
}

/** Small monospace token for ids, uids, and URLs. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code className={cn("font-mono text-xs break-all text-dh-ink", className)}>{children}</code>
  )
}

/** Label/value pair used across the detail panels. */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-dh-ink/10 py-3 last:border-b-0 sm:flex-row sm:gap-6">
      <span className="w-44 shrink-0 text-xs font-[700] uppercase tracking-[0.1em] text-dh-muted">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm font-[300] text-dh-ink">{children}</div>
    </div>
  )
}
