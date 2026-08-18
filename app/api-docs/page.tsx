import { Badge } from "@/components/app/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/app/card"
import { PageHeading } from "@/components/app/page-heading"
import { ConsoleShell } from "@/components/console/shell"
import { Mono } from "@/components/console/states"

export const metadata = { title: "API" }

type Endpoint = { method: string; path: string; summary: string }

const GROUPS: Array<{ title: string; note: string; endpoints: Endpoint[] }> = [
  {
    title: "Okta applications",
    note: "OIDC applications in the org. Client secrets are never returned except once, on create.",
    endpoints: [
      { method: "GET", path: "/api/okta/apps?q=&limit=", summary: "List applications" },
      { method: "POST", path: "/api/okta/apps", summary: "Create an OIDC application" },
      { method: "GET", path: "/api/okta/apps/:appId", summary: "Read one application" },
      { method: "PATCH", path: "/api/okta/apps/:appId", summary: "Update fields, or set status" },
      { method: "DELETE", path: "/api/okta/apps/:appId", summary: "Deactivate then delete" },
    ],
  },
  {
    title: "Assignments",
    note: "Who can reach the application. Group assignment is the usual lever; user assignment is the exception.",
    endpoints: [
      { method: "GET", path: "/api/okta/apps/:appId/groups", summary: "List assigned groups" },
      { method: "POST", path: "/api/okta/apps/:appId/groups", summary: "Assign a group by id" },
      { method: "DELETE", path: "/api/okta/apps/:appId/groups/:groupId", summary: "Remove a group" },
      { method: "GET", path: "/api/okta/apps/:appId/users", summary: "List assigned users" },
      { method: "POST", path: "/api/okta/apps/:appId/users", summary: "Assign a user by id" },
      { method: "DELETE", path: "/api/okta/apps/:appId/users/:userId", summary: "Remove a user" },
      { method: "GET", path: "/api/okta/groups?q=", summary: "Search the group directory" },
      { method: "GET", path: "/api/okta/users?q=", summary: "Search the user directory" },
    ],
  },
  {
    title: "Connectors",
    note: "Vercel Connect OAuth connectors. Pass oktaAppId to pull credentials straight from a managed Okta app.",
    endpoints: [
      { method: "GET", path: "/api/connectors", summary: "List connectors with their attached projects" },
      { method: "POST", path: "/api/connectors", summary: "Create from oktaAppId, or raw issuer + client credentials" },
      { method: "GET", path: "/api/connectors/:connectorId", summary: "Read one connector" },
      { method: "PATCH", path: "/api/connectors/:connectorId", summary: "Update name, credentials, or scopes" },
      { method: "DELETE", path: "/api/connectors/:connectorId", summary: "Delete — refused while a project uses it" },
    ],
  },
  {
    title: "Project Passport",
    note: "Points a project's deployment protection at a connector.",
    endpoints: [
      { method: "GET", path: "/api/projects", summary: "List projects and their Passport state" },
      { method: "GET", path: "/api/projects/:projectId/passport", summary: "Read one project's Passport" },
      { method: "PUT", path: "/api/projects/:projectId/passport", summary: "Apply a connector to the project" },
      { method: "DELETE", path: "/api/projects/:projectId/passport", summary: "Remove Passport protection" },
    ],
  },
  {
    title: "Service",
    note: "Open endpoint, no key required.",
    endpoints: [{ method: "GET", path: "/api/health", summary: "Liveness and configuration probe" }],
  },
]

const EXAMPLE = `# 1. Create an Okta OIDC app pointed at the Connect callback
curl -sX POST "$BASE/api/okta/apps" \\
  -H "x-api-key: $SERVICE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "label": "Internal tools",
    "redirectUris": ["https://connect.vercel.com/callback"]
  }'

# 2. Assign a group to it
curl -sX POST "$BASE/api/okta/apps/$APP_ID/groups" \\
  -H "x-api-key: $SERVICE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{ "id": "00g1abcdEFGHijkl2m3n" }'

# 3. Build a Connect connector from that app
curl -sX POST "$BASE/api/connectors" \\
  -H "x-api-key: $SERVICE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{ "name": "Passport - internal tools", "oktaAppId": "'"$APP_ID"'" }'

# 4. Gate a project with it
curl -sX PUT "$BASE/api/projects/$PROJECT_ID/passport" \\
  -H "x-api-key: $SERVICE_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{ "connectorId": "scl_...", "deploymentType": "all" }'`

export default function ApiDocsPage() {
  return (
    <ConsoleShell current="/api-docs">
      <PageHeading
        eyebrow="Machine interface"
        title="REST API"
        description="Everything the console does is available over HTTP. The UI calls the same server functions these routes call, so the two can never drift apart."
      />

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="max-w-[70ch] text-sm font-[300] leading-relaxed">
            Send the shared key on every <Mono>/api</Mono> request, as either{" "}
            <Mono>x-api-key: $SERVICE_API_KEY</Mono> or <Mono>Authorization: Bearer $SERVICE_API_KEY</Mono>. Requests
            without it get <Mono>401</Mono>. The browser console does not use the key — it is gated by Vercel Passport
            on the deployment instead.
          </p>
          <p className="max-w-[70ch] text-sm font-[300] leading-relaxed text-dh-muted">
            Errors always come back as{" "}
            <Mono>{'{ "error": { "code", "message", "details" } }'}</Mono> with a matching HTTP status.
          </p>
        </CardContent>
      </Card>

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <p className="text-sm font-[300] text-dh-muted">{group.note}</p>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-dh-ink/10 p-0">
            {group.endpoints.map((endpoint) => (
              <div
                key={`${endpoint.method} ${endpoint.path}`}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="w-16 shrink-0">
                  <Badge variant={endpoint.method === "GET" ? "outline" : "neutral"}>{endpoint.method}</Badge>
                </span>
                <Mono className="flex-1 text-sm">{endpoint.path}</Mono>
                <span className="text-sm font-[300] text-dh-muted sm:w-80 sm:shrink-0">{endpoint.summary}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>End-to-end example</CardTitle>
          <p className="text-sm font-[300] text-dh-muted">
            The full chain, from a new Okta app to a gated project.
          </p>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto bg-dh-band p-5 font-mono text-xs leading-relaxed text-dh-ink">
            {EXAMPLE}
          </pre>
        </CardContent>
      </Card>
    </ConsoleShell>
  )
}
