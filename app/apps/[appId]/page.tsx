import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/app/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/app/card"
import { TBody, TD, TH, THead, TR, Table } from "@/components/app/data-table"
import { Field, Input, Textarea } from "@/components/app/field"
import { PageHeading } from "@/components/app/page-heading"
import { ActionForm, SubmitButton } from "@/components/console/action-form"
import { AssignPicker } from "@/components/console/assign-picker"
import { ConsoleShell } from "@/components/console/shell"
import { DetailRow, EmptyState, ErrorNotice, Mono } from "@/components/console/states"
import { Button } from "@/components/ui/button"
import {
  createConnectorAction,
  deleteAppAction,
  setAppStatusAction,
  unassignAction,
  updateAppAction,
} from "@/app/actions"
import { ServiceError, errorMessage } from "@/lib/errors"
import { getApp, listAppGroups, listAppUsers, type OktaAssignment } from "@/lib/okta"
import { listConnectors } from "@/lib/vercel"

export const dynamic = "force-dynamic"

export default async function AppDetailPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params

  let app
  try {
    app = await getApp(appId)
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) notFound()
    return (
      <ConsoleShell current="/apps">
        <ErrorNotice title="Could not load this application" message={errorMessage(error)} />
      </ConsoleShell>
    )
  }

  const [groups, users, connectors] = await Promise.all([
    listAppGroups(appId).catch((e) => ({ error: errorMessage(e) }) as const),
    listAppUsers(appId).catch((e) => ({ error: errorMessage(e) }) as const),
    listConnectors().catch(() => []),
  ])

  // Connectors already built from this app's client id.
  const linked = connectors.filter((c) => c.data?.clientId && c.data.clientId === app.clientId)

  return (
    <ConsoleShell current="/apps">
      <div className="flex flex-col gap-2">
        <Link
          href="/apps"
          className="text-xs font-[700] uppercase tracking-[0.1em] text-dh-muted hover:text-dh-ink"
        >
          Back to applications
        </Link>
      </div>

      <PageHeading
        eyebrow="Okta application"
        title={app.label}
        actions={
          <div className="flex items-center gap-3">
            {app.status === "ACTIVE" ? (
              <Badge variant="neutral">Active</Badge>
            ) : (
              <Badge variant="red">Inactive</Badge>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <DetailRow label="App ID">
            <Mono>{app.id}</Mono>
          </DetailRow>
          <DetailRow label="Client ID">
            {app.clientId ? <Mono>{app.clientId}</Mono> : "Not an OIDC client"}
          </DetailRow>
          <DetailRow label="Client secret">
            <span className="text-dh-muted">
              Held in Okta. Read server-side when a connector is created; never displayed here.
            </span>
          </DetailRow>
          <DetailRow label="Issuer">{app.issuer ? <Mono>{app.issuer}</Mono> : "—"}</DetailRow>
          <DetailRow label="Sign-on mode">{app.signOnMode}</DetailRow>
          <DetailRow label="Grant types">{app.grantTypes.join(", ") || "—"}</DetailRow>
          <DetailRow label="Redirect URIs">
            <div className="flex flex-col gap-1">
              {app.redirectUris.length > 0 ? (
                app.redirectUris.map((uri) => <Mono key={uri}>{uri}</Mono>)
              ) : (
                <span className="text-dh-muted">None</span>
              )}
            </div>
          </DetailRow>
          <DetailRow label="Connectors">
            {linked.length > 0 ? (
              <div className="flex flex-col gap-1">
                {linked.map((c) => (
                  <Link
                    key={c.id}
                    href="/connectors"
                    className="underline decoration-dh-ink/25 underline-offset-4 hover:decoration-dh-red"
                  >
                    {c.displayName || c.name}
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-dh-muted">None yet</span>
            )}
          </DetailRow>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <AssignmentPanel
          title="Group assignments"
          kind="group"
          appId={appId}
          data={groups}
          emptyMessage="No groups are assigned to this application."
        />
        <AssignmentPanel
          title="User assignments"
          kind="user"
          appId={appId}
          data={users}
          emptyMessage="No individual users are assigned to this application."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Create a Connect connector</CardTitle>
          </CardHeader>
          <CardContent>
            {app.clientId ? (
              <ActionForm action={createConnectorAction}>
                <input type="hidden" name="oktaAppId" value={appId} />
                <Field
                  label="Connector name"
                  htmlFor="connector-name"
                  hint="The client id and secret are read from this Okta app server-side."
                >
                  <Input id="connector-name" name="name" required defaultValue={`Passport — ${app.label}`} />
                </Field>
                <Field label="Scopes" htmlFor="scopes" hint="Comma or newline separated.">
                  <Input id="scopes" name="scopes" defaultValue="openid, profile, email, groups" />
                </Field>
                <Field label="Forwarded claims" htmlFor="forwardedClaims">
                  <Input
                    id="forwardedClaims"
                    name="forwardedClaims"
                    defaultValue="email, name, preferred_username, groups"
                  />
                </Field>
                <SubmitButton pendingLabel="Creating">Create connector</SubmitButton>
              </ActionForm>
            ) : (
              <EmptyState message="This application has no OIDC client credentials, so it cannot back a connector." />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit application</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={updateAppAction}>
                <input type="hidden" name="appId" value={appId} />
                <Field label="Label" htmlFor="edit-label">
                  <Input id="edit-label" name="label" defaultValue={app.label} />
                </Field>
                <Field label="Redirect URIs" htmlFor="edit-redirects" hint="One per line.">
                  <Textarea id="edit-redirects" name="redirectUris" rows={3} defaultValue={app.redirectUris.join("\n")} />
                </Field>
                <Field label="Post-logout URIs" htmlFor="edit-logout" hint="One per line.">
                  <Textarea
                    id="edit-logout"
                    name="postLogoutRedirectUris"
                    rows={2}
                    defaultValue={app.postLogoutRedirectUris.join("\n")}
                  />
                </Field>
                <SubmitButton pendingLabel="Saving" variant="outline">
                  Save changes
                </SubmitButton>
              </ActionForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ActionForm action={setAppStatusAction}>
                <input type="hidden" name="appId" value={appId} />
                <input type="hidden" name="next" value={app.status === "ACTIVE" ? "deactivate" : "activate"} />
                <SubmitButton variant="outline" size="sm" pendingLabel="Working">
                  {app.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </SubmitButton>
              </ActionForm>

              <ActionForm
                action={deleteAppAction}
                confirm={`Permanently delete "${app.label}" from Okta? Any connector built from it will stop working.`}
              >
                <input type="hidden" name="appId" value={appId} />
                <p className="text-sm font-[300] text-dh-muted">
                  Deleting deactivates the app first, then removes it. Connectors built from it keep stale
                  credentials until you delete them too.
                </p>
                <SubmitButton size="sm" pendingLabel="Deleting">
                  Delete application
                </SubmitButton>
              </ActionForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConsoleShell>
  )
}

/** One assignment table plus its picker — used for both groups and users. */
function AssignmentPanel({
  title,
  kind,
  appId,
  data,
  emptyMessage,
}: {
  title: string
  kind: "group" | "user"
  appId: string
  data: OktaAssignment[] | { error: string }
  emptyMessage: string
}) {
  const failed = !Array.isArray(data)
  const rows = Array.isArray(data) ? data : []

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>{title}</CardTitle>
        {!failed ? <Badge variant="outline">{rows.length}</Badge> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {failed ? (
          <p className="text-sm font-[300] text-dh-red">{(data as { error: string }).error}</p>
        ) : rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH className="w-24 text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  <TD>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-[500]">{row.name}</span>
                      {row.secondary ? (
                        <span className="text-xs text-dh-muted">{row.secondary}</span>
                      ) : null}
                    </div>
                  </TD>
                  <TD className="text-right">
                    <ActionForm
                      action={unassignAction}
                      className="items-end gap-1"
                      confirm={`Remove ${row.name} from this application?`}
                    >
                      <input type="hidden" name="appId" value={appId} />
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={row.id} />
                      <SubmitButton variant="ghost" size="sm" pendingLabel="Removing">
                        Remove
                      </SubmitButton>
                    </ActionForm>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}

        <div className="border-t border-dh-ink/10 pt-6">
          <AssignPicker appId={appId} kind={kind} />
        </div>
      </CardContent>
    </Card>
  )
}
