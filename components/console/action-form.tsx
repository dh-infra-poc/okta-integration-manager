"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ActionState } from "@/app/actions"

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>

/** Submit button that reflects the enclosing form's pending state. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "default",
  className,
}: {
  children: React.ReactNode
  pendingLabel?: string
  variant?: "primary" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "Working") : children}
    </Button>
  )
}

/** Renders the result of a Server Action as a flat inline notice. */
export function ResultNotice({ state }: { state: ActionState }) {
  if (!state?.ok && !state?.error) return null
  const isError = Boolean(state.error)
  return (
    <p
      role="status"
      className={cn(
        "border-l-2 py-1 pl-3 text-sm font-[300]",
        isError ? "border-dh-red text-dh-red" : "border-dh-ink/40 text-dh-ink",
      )}
    >
      {state.error ?? state.ok}
    </p>
  )
}

/**
 * A form bound to a Server Action, with its result notice rendered beneath.
 * `confirm` guards destructive submissions.
 */
export function ActionForm({
  action,
  className,
  confirm,
  children,
}: {
  action: Action
  className?: string
  confirm?: string
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null)

  return (
    <form
      action={formAction}
      className={cn("flex flex-col gap-4", className)}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault()
      }}
    >
      {children}
      <ResultNotice state={state} />
    </form>
  )
}
