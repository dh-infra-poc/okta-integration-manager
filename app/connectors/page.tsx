import { Badge } from "@/components/app/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/app/card"
import { Field, Input } from "@/components/app/field"
import { PageHeading } from "@/components/app/page-heading"
import { ActionForm, SubmitButton } from "@/components/console/action-form"
import { ConsoleShell } from "@/components/console/shell"
import { DetailRow, EmptyState, ErrorNotice, Mono } from "@/components/console/states"
import { PassportAttachForm } from "@/components/console/passport-form"
import { createConnectorAction, deleteConnectorAction } from "@/app/actions"
import { errorMessage } from "@/lib/errors"
import { listApps, type OktaApp } from "@/lib/okta"
import { listConnectorsWithAttachments, listProjects, type Connector, type Project } from "@/lib/vercel"

export const dynamic = "force-dynamic"
export const metadata = { title: "Connectors" }

export default async function ConnectorsPage() {
  let connectors: Connector[] = []
  let projects: Project[] = []
  let error: string | undefined
  try {
    ;[connectors, projects] = await Promise.all([listConnectorsWithAttachments(), listProjects()])
  } catch (e) {
    error = errorMessage(e)
  }

  // Only OIDC apps can back a connector.
  const apps: OktaApp[] = await listApps({ limit: 200 })
    .then((list) => list.filter((a) => Boolean(a.clientId)))
    .catch(() => [])

  return (
    <ConsoleShell current="/connectors">
      <PageHeading
        eyebrow="Vercel Connect"
        title="Connectors"
        description="Each OAuth connector wraps an Okta application's credentials. Attaching one to a project's Passport is what actually puts the deployment behind Okta."
      />

      {error ? <ErrorNotice title="Could not list connectors" message={error} /> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {!error && connectors.length === 0 ? (
            <EmptyState message="This team has no Connect connectors yet." />
          ) : (
            connectors.map((connector) => (
              <Card key={connector.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle>{connector.displayName || connector.name}</CardTitle>
                    <Mono className="text-dh-muted">{connector.uid}</Mono>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {connector.attachedProjects && connector.attachedProjects.length > 0 ? (
                      <Badge variant="red">In use</Badge>
                    ) : (
                      <Badge variant="outline">{connector.type}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <DetailRow label="Connector ID">
                    <Mono>{connector.id}</Mono>
                  </DetailRow>
                  <DetailRow label="Issuer">
                    {connector.data?.serverConfig?.issuer ? (
                      <Mono>{String(connector.data.serverConfig.issuer)}</Mono>
                    ) : connector.data?.serverUrl ? (
                      <Mono>{connector.data.serverUrl}</Mono>
                    ) : (
                      <span className="text-dh-muted">—</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Client ID">
                    {connector.data?.clientId ? (
                      <Mono>{connector.data.clientId}</Mono>
                    ) : (
                      <span className="text-dh-muted">—</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Scopes">
                    {connector.data?.userAuthorization?.scopes?.join(", ") || (
                      <span className="text-dh-muted">Defaults</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Gating">
                    {connector.attachedProjects && connector.attachedProjects.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {connector.attachedProjects.map((p) => (
                          <span key={p.id}>
                            {p.name} <span className="text-dh-muted">({p.deploymentType})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-dh-muted">No project</span>
                    )}
                  </DetailRow>
                </CardContent>

                <div className="flex flex-col gap-6 border-t border-dh-ink/10 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <PassportAttachForm connectorId={connector.id} projects={projects} />

                  <ActionForm
                    action={deleteConnectorAction}
                    confirm={`Delete connector "${connector.displayName || connector.name}"?`}
                    className="shrink-0"
                  >
                    <input type="hidden" name="connectorId" value={connector.id} />
                    <SubmitButton variant="ghost" size="sm" pendingLabel="Deleting">
                      Delete connector
                    </SubmitButton>
                  </ActionForm>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle>New connector</CardTitle>
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <EmptyState message="No OIDC application is available in Okta to back a connector." />
            ) : (
              <ActionForm action={createConnectorAction}>
                <Field label="Okta application" htmlFor="oktaAppId">
                  <select
                    id="oktaAppId"
                    name="oktaAppId"
                    required
                    defaultValue=""
                    className="h-11 w-full border border-dh-ink/25 bg-dh-white px-3 text-base font-[300] text-dh-ink outline-none transition-colors focus-visible:border-dh-red focus-visible:ring-2 focus-visible:ring-dh-red/40"
                  >
                    <option value="" disabled>
                      Choose an application
                    </option>
                    {apps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Connector name" htmlFor="new-connector-name">
                  <Input id="new-connector-name" name="name" required placeholder="Passport — internal tools" />
                </Field>
                <Field label="Scopes" htmlFor="new-scopes" hint="Comma or newline separated.">
                  <Input id="new-scopes" name="scopes" defaultValue="openid, profile, email, groups" />
                </Field>
                <Field label="Forwarded claims" htmlFor="new-claims">
                  <Input id="new-claims" name="forwardedClaims" defaultValue="email, name, preferred_username, groups" />
                </Field>
                <SubmitButton pendingLabel="Creating">Create connector</SubmitButton>
              </ActionForm>
            )}
          </CardContent>
        </Card>
      </div>
    </ConsoleShell>
  )
}
