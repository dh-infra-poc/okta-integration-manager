import Link from "next/link"

import { Badge } from "@/components/app/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/app/card"
import { PageHeading } from "@/components/app/page-heading"
import { StatCard } from "@/components/app/stat-card"
import { TBody, TD, TH, THead, TR, Table } from "@/components/app/data-table"
import { ConsoleShell } from "@/components/console/shell"
import { EmptyState, Mono } from "@/components/console/states"
import { Button } from "@/components/ui/button"
import { configStatus } from "@/lib/env"
import { errorMessage } from "@/lib/errors"
import { listApps } from "@/lib/okta"
import { listConnectors, listProjects } from "@/lib/vercel"

export const dynamic = "force-dynamic"

/** Resolves a promise into either its value or a readable failure string. */
async function attempt<T>(promise: Promise<T>): Promise<{ value?: T; error?: string }> {
  try {
    return { value: await promise }
  } catch (error) {
    return { error: errorMessage(error) }
  }
}

export default async function OverviewPage() {
  const [apps, connectors, projects] = await Promise.all([
    attempt(listApps({ limit: 200 })),
    attempt(listConnectors()),
    attempt(listProjects()),
  ])

  const config = configStatus()
  const blocked = config.filter((c) => c.required && !c.present)

  const gated = projects.value?.filter((p) => p.passport) ?? []
  const oidcConnectors = connectors.value?.filter((c) => c.type === "oauth") ?? []

  return (
    <ConsoleShell current="/">
      <PageHeading
        eyebrow="Access control plane"
        title="Okta to Connect to Passport"
        description="One chain, three systems. An Okta OIDC app holds the identity, a Vercel Connect connector wraps its credentials, and a project's Passport points at that connector to gate the deployment."
        actions={
          <Button render={<Link href="/apps" />} nativeButton={false} variant="outline">
            Manage apps
          </Button>
        }
      />

      <div className="grid gap-px bg-dh-ink/15 sm:grid-cols-3">
        <StatCard
          label="Okta applications"
          value={apps.value ? apps.value.length : "—"}
          hint={
            apps.error
              ? "Okta unreachable"
              : `${apps.value?.filter((a) => a.status === "ACTIVE").length ?? 0} active`
          }
        />
        <StatCard
          label="Connect connectors"
          value={connectors.value ? connectors.value.length : "—"}
          hint={connectors.error ? "Vercel unreachable" : `${oidcConnectors.length} OAuth / OIDC`}
        />
        <StatCard
          label="Projects gated"
          value={projects.value ? gated.length : "—"}
          hint={projects.error ? "Vercel unreachable" : `of ${projects.value?.length ?? 0} projects`}
        />
      </div>

      {apps.error ? (
        <Card className="border-dh-red/40">
          <CardContent className="flex flex-col gap-2">
            <span aria-hidden className="h-1 w-10 bg-dh-red" />
            <h3 className="text-base font-[800]">Okta is not answering</h3>
            <p className="max-w-[70ch] text-sm font-[300] leading-relaxed">{apps.error}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Configuration</CardTitle>
          {blocked.length === 0 ? (
            <Badge variant="neutral">Ready</Badge>
          ) : (
            <Badge variant="red">{blocked.length} missing</Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Variable</TH>
                <TH>State</TH>
                <TH className="hidden sm:table-cell">Purpose</TH>
              </TR>
            </THead>
            <TBody>
              {config.map((item) => (
                <TR key={item.key}>
                  <TD>
                    <Mono>{item.key}</Mono>
                  </TD>
                  <TD>
                    {item.present ? (
                      "Set"
                    ) : item.required ? (
                      <span className="font-[700] text-dh-red">Required</span>
                    ) : (
                      <span className="text-dh-muted">Not set</span>
                    )}
                  </TD>
                  <TD className="hidden text-dh-muted sm:table-cell">{item.note}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects currently behind Passport</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projects.error ? (
            <p className="p-6 text-sm font-[300] text-dh-red">{projects.error}</p>
          ) : gated.length === 0 ? (
            <EmptyState className="m-6 border-0 p-0" message="No project in this team uses Passport yet." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Connector</TH>
                  <TH>Scope</TH>
                </TR>
              </THead>
              <TBody>
                {gated.map((project) => {
                  const connector = connectors.value?.find((c) => c.id === project.passport?.connectorId)
                  return (
                    <TR key={project.id}>
                      <TD className="font-[500]">{project.name}</TD>
                      <TD>
                        {connector ? (
                          connector.displayName || connector.name
                        ) : (
                          <Mono>{project.passport?.connectorId}</Mono>
                        )}
                      </TD>
                      <TD className="text-dh-muted">{project.passport?.deploymentType}</TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ConsoleShell>
  )
}
