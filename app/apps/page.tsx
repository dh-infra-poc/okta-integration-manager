import Link from "next/link"

import { Badge } from "@/components/app/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/app/card"
import { TBody, TD, TH, THead, TR, Table } from "@/components/app/data-table"
import { Field, Input, Textarea } from "@/components/app/field"
import { PageHeading } from "@/components/app/page-heading"
import { ActionForm, SubmitButton } from "@/components/console/action-form"
import { ConsoleShell } from "@/components/console/shell"
import { EmptyState, ErrorNotice, Mono } from "@/components/console/states"
import { createAppAction } from "@/app/actions"
import { errorMessage } from "@/lib/errors"
import { listApps, type OktaApp } from "@/lib/okta"
import { CONNECT_CALLBACK_URL } from "@/lib/schema"

export const dynamic = "force-dynamic"
export const metadata = { title: "Okta apps" }

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  let apps: OktaApp[] = []
  let error: string | undefined
  try {
    apps = await listApps({ query: q, limit: 200 })
  } catch (e) {
    error = errorMessage(e)
  }

  return (
    <ConsoleShell current="/apps">
      <PageHeading
        eyebrow="Okta"
        title="Applications"
        description="OIDC applications in the Okta org. Each one can back a Vercel Connect connector, which in turn gates a project with Passport."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <form className="flex items-end gap-3" action="/apps">
            <Field label="Search" htmlFor="q" className="flex-1">
              <Input id="q" name="q" defaultValue={q ?? ""} placeholder="Filter by label" />
            </Field>
            <button
              type="submit"
              className="h-11 border border-dh-ink px-6 text-sm font-[700] uppercase tracking-[0.06em] transition-colors hover:bg-dh-ink hover:text-dh-white"
            >
              Search
            </button>
          </form>

          {error ? (
            <ErrorNotice title="Could not list Okta applications" message={error} />
          ) : apps.length === 0 ? (
            <EmptyState message={q ? `No application matches "${q}".` : "This org has no applications yet."} />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Label</TH>
                  <TH>Client ID</TH>
                  <TH>Status</TH>
                  <TH>Mode</TH>
                </TR>
              </THead>
              <TBody>
                {apps.map((app) => (
                  <TR key={app.id}>
                    <TD>
                      <Link
                        href={`/apps/${app.id}`}
                        className="font-[500] underline decoration-dh-ink/25 underline-offset-4 hover:decoration-dh-red"
                      >
                        {app.label}
                      </Link>
                    </TD>
                    <TD>{app.clientId ? <Mono>{app.clientId}</Mono> : <span className="text-dh-muted">—</span>}</TD>
                    <TD>
                      {app.status === "ACTIVE" ? (
                        <Badge variant="neutral">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TD>
                    <TD className="text-dh-muted">{app.signOnMode}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>

        <Card className="lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle>New OIDC application</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={createAppAction}>
              <Field label="Label" htmlFor="label">
                <Input id="label" name="label" required placeholder="Internal dashboard" />
              </Field>
              <Field
                label="Redirect URIs"
                htmlFor="redirectUris"
                hint="One per line. The Connect callback is prefilled — keep it if this app will back a connector."
              >
                <Textarea id="redirectUris" name="redirectUris" defaultValue={CONNECT_CALLBACK_URL} rows={3} />
              </Field>
              <Field label="Post-logout URIs" htmlFor="postLogoutRedirectUris" hint="Optional, one per line.">
                <Textarea id="postLogoutRedirectUris" name="postLogoutRedirectUris" rows={2} />
              </Field>
              <SubmitButton pendingLabel="Creating">Create application</SubmitButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </ConsoleShell>
  )
}
