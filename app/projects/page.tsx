import { Badge } from "@/components/app/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/app/card"
import { Field } from "@/components/app/field"
import { PageHeading } from "@/components/app/page-heading"
import { ActionForm, SubmitButton } from "@/components/console/action-form"
import { ConsoleShell } from "@/components/console/shell"
import { EmptyState, ErrorNotice, Mono } from "@/components/console/states"
import { setPassportAction } from "@/app/actions"
import { errorMessage } from "@/lib/errors"
import { DEPLOYMENT_LABELS } from "@/lib/passport-types"
import { listConnectors, listProjects, type Connector, type Project } from "@/lib/vercel"

export const dynamic = "force-dynamic"
export const metadata = { title: "Projects" }

const selectClass =
  "h-11 w-full border border-dh-ink/25 bg-dh-white px-3 text-base font-[300] text-dh-ink outline-none transition-colors focus-visible:border-dh-red focus-visible:ring-2 focus-visible:ring-dh-red/40"

export default async function ProjectsPage() {
  let projects: Project[] = []
  let connectors: Connector[] = []
  let error: string | undefined
  try {
    ;[projects, connectors] = await Promise.all([listProjects(), listConnectors()])
  } catch (e) {
    error = errorMessage(e)
  }

  const gated = projects.filter((p) => p.passport).length

  return (
    <ConsoleShell current="/projects">
      <PageHeading
        eyebrow="Vercel Passport"
        title="Projects"
        description="Passport gates a deployment behind a connector. Changing it here takes effect on the next request to the protected deployment."
        actions={<Badge variant="outline">{`${gated} of ${projects.length} gated`}</Badge>}
      />

      {error ? <ErrorNotice title="Could not list projects" message={error} /> : null}

      {!error && projects.length === 0 ? (
        <EmptyState message="No projects were returned for this team." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project) => {
            const current = project.passport
              ? connectors.find((c) => c.id === project.passport?.connectorId)
              : undefined

            return (
              <Card key={project.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle>{project.name}</CardTitle>
                    <Mono className="text-dh-muted">{project.id}</Mono>
                  </div>
                  {project.passport ? (
                    <Badge variant="red">Gated</Badge>
                  ) : (
                    <Badge variant="outline">Open</Badge>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                  <p className="text-sm font-[300] text-dh-ink">
                    {project.passport ? (
                      <>
                        Behind{" "}
                        <span className="font-[700]">
                          {current ? current.displayName || current.name : project.passport.connectorId}
                        </span>{" "}
                        <span className="text-dh-muted">({project.passport.deploymentType})</span>
                      </>
                    ) : (
                      <span className="text-dh-muted">No Passport configuration on this project.</span>
                    )}
                  </p>

                  <ActionForm action={setPassportAction} className="gap-3">
                    <input type="hidden" name="projectId" value={project.id} />

                    <Field label="Connector" htmlFor={`connector-${project.id}`}>
                      <select
                        id={`connector-${project.id}`}
                        name="connectorId"
                        defaultValue={project.passport?.connectorId ?? ""}
                        className={selectClass}
                      >
                        <option value="">None — remove Passport</option>
                        {connectors.map((connector) => (
                          <option key={connector.id} value={connector.id}>
                            {connector.displayName || connector.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Scope" htmlFor={`scope-${project.id}`}>
                      <select
                        id={`scope-${project.id}`}
                        name="deploymentType"
                        defaultValue={project.passport?.deploymentType ?? "all"}
                        className={selectClass}
                      >
                        {Object.entries(DEPLOYMENT_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <SubmitButton variant="outline" size="sm" pendingLabel="Saving">
                      Save Passport
                    </SubmitButton>
                  </ActionForm>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </ConsoleShell>
  )
}
