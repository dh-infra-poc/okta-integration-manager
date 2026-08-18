"use client"

import { useId } from "react"

import { Field } from "@/components/app/field"
import { ActionForm, SubmitButton } from "@/components/console/action-form"
import { setPassportAction } from "@/app/actions"
import { DEPLOYMENT_LABELS, DEPLOYMENT_TYPES, type ProjectSummary } from "@/lib/passport-types"

const selectClass =
  "h-11 w-full border border-dh-ink/25 bg-dh-white px-3 text-base font-[300] text-dh-ink outline-none transition-colors focus-visible:border-dh-red focus-visible:ring-2 focus-visible:ring-dh-red/40"

/** Attach this connector to a project's Passport. Rendered per connector. */
export function PassportAttachForm({
  connectorId,
  projects,
}: {
  connectorId: string
  projects: ProjectSummary[]
}) {
  const projectId = useId()
  const scopeId = useId()

  return (
    <ActionForm action={setPassportAction} className="w-full max-w-xl gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="connectorId" value={connectorId} />

      <Field label="Apply to project" htmlFor={projectId} className="flex-1">
        <select id={projectId} name="projectId" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            Choose a project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.passport ? (project.passport.connectorId === connectorId ? " — current" : " — gated") : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Scope" htmlFor={scopeId} className="sm:w-56">
        <select id={scopeId} name="deploymentType" defaultValue="all" className={selectClass}>
          {DEPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DEPLOYMENT_LABELS[type] ?? type}
            </option>
          ))}
        </select>
      </Field>

      <SubmitButton variant="outline" pendingLabel="Applying" className="sm:mb-0">
        Apply Passport
      </SubmitButton>
    </ActionForm>
  )
}
