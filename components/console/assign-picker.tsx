"use client"

import { useEffect, useId, useState, useTransition } from "react"

import { Field, Input } from "@/components/app/field"
import { ActionForm, SubmitButton } from "@/components/console/action-form"
import { assignAction } from "@/app/actions"
import { searchDirectory, type DirectoryEntry } from "@/app/apps/[appId]/search"

/**
 * Type-ahead over the Okta directory. The lookup runs as a Server Action so
 * the Okta token never reaches the browser; only ids and display names do.
 */
export function AssignPicker({ appId, kind }: { appId: string; kind: "group" | "user" }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<DirectoryEntry[]>([])
  const [selected, setSelected] = useState<DirectoryEntry | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputId = useId()
  const listId = useId()

  useEffect(() => {
    // Debounce so typing doesn't hammer the Okta directory endpoints.
    const handle = setTimeout(() => {
      startTransition(async () => {
        const outcome = await searchDirectory(kind, query)
        if (outcome.error) {
          setError(outcome.error)
          setResults([])
        } else {
          setError(null)
          setResults(outcome.entries ?? [])
        }
      })
    }, 250)
    return () => clearTimeout(handle)
  }, [query, kind])

  const noun = kind === "group" ? "group" : "user"

  return (
    <ActionForm action={assignAction}>
      <input type="hidden" name="appId" value={appId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={selected?.id ?? ""} />

      <Field
        label={`Find a ${noun}`}
        htmlFor={inputId}
        hint={error ?? (selected ? `Selected ${selected.name}` : `Search the Okta directory, then pick a ${noun}.`)}
        error={Boolean(error)}
      >
        <Input
          id={inputId}
          value={query}
          autoComplete="off"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          placeholder={kind === "group" ? "Engineering" : "name@company.com"}
          onChange={(event) => {
            setQuery(event.target.value)
            setSelected(null)
          }}
        />
      </Field>

      <ul id={listId} className="max-h-56 divide-y divide-dh-ink/10 overflow-y-auto border border-dh-ink/15">
        {pending && results.length === 0 ? (
          <li className="px-3 py-2 text-sm font-[300] text-dh-muted">Searching…</li>
        ) : results.length === 0 ? (
          <li className="px-3 py-2 text-sm font-[300] text-dh-muted">No {noun}s found.</li>
        ) : (
          results.map((entry) => {
            const isSelected = selected?.id === entry.id
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(entry)}
                  className={
                    "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-dh-band " +
                    (isSelected ? "bg-dh-band" : "")
                  }
                >
                  <span className="flex w-full items-center gap-2 text-sm font-[500] text-dh-ink">
                    {isSelected ? <span aria-hidden className="h-2 w-2 shrink-0 bg-dh-red" /> : null}
                    {entry.name}
                  </span>
                  {entry.secondary ? (
                    <span className="text-xs font-[300] text-dh-muted">{entry.secondary}</span>
                  ) : null}
                </button>
              </li>
            )
          })
        )}
      </ul>

      <SubmitButton pendingLabel="Assigning" size="sm">
        Assign {noun}
      </SubmitButton>
    </ActionForm>
  )
}
