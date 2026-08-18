import "server-only"

import { vercelApiToken, vercelTeamId } from "@/lib/env"
import { ServiceError, notConfigured } from "@/lib/errors"
import { DEPLOYMENT_TYPES, type DeploymentType, type PassportConfig } from "@/lib/passport-types"

export { DEPLOYMENT_TYPES }
export type { DeploymentType, PassportConfig }

const API = "https://api.vercel.com"

/* ---------------------------------------------------------------------- */
/* Types                                                                   */
/* ---------------------------------------------------------------------- */

export type ConnectorData = {
  serverUrl?: string
  serverConfig?: Record<string, unknown>
  clientId?: string
  clientName?: string
  clientSecret?: unknown
  tokenEndpointAuthMethod?: string
  userAuthorization?: { enabled: boolean; scopes?: string[] }
  forwardedClaims?: { idToken?: string[] }
}

export type Connector = {
  id: string
  uid: string
  name: string
  displayName?: string
  type: string
  service?: string
  creationMode?: string
  createdAt?: number
  updatedAt?: number
  supportedSubjectTypes?: string[]
  data?: ConnectorData
  /** Projects whose Passport currently points at this connector. */
  attachedProjects?: Array<{ id: string; name: string; deploymentType: string }>
}

export type Project = {
  id: string
  name: string
  framework?: string | null
  updatedAt?: number
  passport: PassportConfig
}

/* ---------------------------------------------------------------------- */
/* Transport                                                               */
/* ---------------------------------------------------------------------- */

async function vercelFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = vercelApiToken()
  const teamId = vercelTeamId()
  if (!token) throw notConfigured(["VERCEL_API_TOKEN"])
  if (!teamId) throw notConfigured(["VERCEL_TEAM_ID"])

  // Every route is team-scoped; the CLI proved item routes need teamId in the query.
  const url = new URL(`${API}${path}`)
  url.searchParams.set("teamId", teamId)

  const res = await fetch(url, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const json = text ? JSON.parse(text) : undefined

  if (!res.ok) {
    const message = json?.error?.message || `Vercel request failed (${res.status})`
    throw new ServiceError(res.status >= 500 ? 502 : res.status, json?.error?.code || "vercel_error", message, {
      path,
    })
  }

  return json as T
}

/* ---------------------------------------------------------------------- */
/* Connectors                                                              */
/* ---------------------------------------------------------------------- */

export async function listConnectors(): Promise<Connector[]> {
  const data = await vercelFetch<{ clients?: Connector[] }>("/v1/connect/connectors")
  return data.clients ?? []
}

export async function getConnector(id: string): Promise<Connector> {
  return vercelFetch<Connector>(`/v1/connect/connectors/${encodeURIComponent(id)}`)
}

/** Connectors annotated with the projects whose Passport points at them. */
export async function listConnectorsWithAttachments(): Promise<Connector[]> {
  const [connectors, projects] = await Promise.all([listConnectors(), listProjects()])
  return connectors.map((connector) => ({
    ...connector,
    attachedProjects: projects
      .filter((p) => p.passport?.connectorId === connector.id)
      .map((p) => ({ id: p.id, name: p.name, deploymentType: p.passport?.deploymentType ?? "all" })),
  }))
}

export type CreateOAuthConnectorInput = {
  /** Connector display name. */
  name: string
  /** Service slug, e.g. "okta.com". Combined with a slug to form the uid. */
  service?: string
  /** Explicit uid; defaults to `${service}/${slugify(name)}`. */
  uid?: string
  issuer: string
  clientId: string
  clientSecret: string
  scopes?: string[]
  forwardedClaims?: string[]
  tokenEndpointAuthMethod?: string
  serverConfig?: Record<string, unknown>
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/**
 * Reads the OIDC discovery document for an issuer so the connector carries an
 * explicit serverConfig rather than relying on Vercel-side discovery.
 */
export async function discoverOidcConfig(issuer: string): Promise<Record<string, unknown>> {
  const base = issuer.replace(/\/+$/, "")
  const res = await fetch(`${base}/.well-known/openid-configuration`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new ServiceError(
      502,
      "oidc_discovery_failed",
      `Could not read the OpenID configuration at ${base}/.well-known/openid-configuration (${res.status})`,
    )
  }
  const doc = (await res.json()) as Record<string, unknown>
  const pick = [
    "issuer",
    "authorization_endpoint",
    "token_endpoint",
    "userinfo_endpoint",
    "jwks_uri",
    "end_session_endpoint",
    "introspection_endpoint",
    "revocation_endpoint",
    "registration_endpoint",
    "device_authorization_endpoint",
    "response_types_supported",
    "token_endpoint_auth_methods_supported",
    "scopes_supported",
    "grant_types_supported",
    "subject_types_supported",
    "id_token_signing_alg_values_supported",
    "code_challenge_methods_supported",
    "claims_supported",
  ]
  return Object.fromEntries(pick.filter((k) => doc[k] !== undefined).map((k) => [k, doc[k]]))
}

export async function createOAuthConnector(input: CreateOAuthConnectorInput): Promise<Connector> {
  const service = input.service ?? "okta.com"
  const uid = input.uid ?? `${service}/${slugify(input.name)}`
  const serverConfig = input.serverConfig ?? (await discoverOidcConfig(input.issuer))

  const body = {
    type: "oauth",
    service,
    uid,
    name: input.name,
    data: {
      serverUrl: input.issuer.replace(/\/+$/, ""),
      serverConfig,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      tokenEndpointAuthMethod: input.tokenEndpointAuthMethod ?? "client_secret_basic",
      userAuthorization: {
        enabled: true,
        scopes: input.scopes?.length ? input.scopes : ["openid", "profile", "email", "groups"],
      },
      forwardedClaims: {
        idToken: input.forwardedClaims?.length
          ? input.forwardedClaims
          : ["email", "name", "preferred_username", "groups"],
      },
    },
  }

  return vercelFetch<Connector>("/v1/connect/connectors", { method: "POST", body: JSON.stringify(body) })
}

export type UpdateConnectorInput = {
  name?: string
  clientId?: string
  clientSecret?: string
  scopes?: string[]
  forwardedClaims?: string[]
}

export async function updateConnector(id: string, input: UpdateConnectorInput): Promise<Connector> {
  const data: Record<string, unknown> = {}
  if (input.clientId) data.clientId = input.clientId
  if (input.clientSecret) data.clientSecret = input.clientSecret
  if (input.scopes?.length) data.userAuthorization = { enabled: true, scopes: input.scopes }
  if (input.forwardedClaims?.length) data.forwardedClaims = { idToken: input.forwardedClaims }

  const body: Record<string, unknown> = {}
  if (input.name) body.name = input.name
  if (Object.keys(data).length > 0) body.data = data

  return vercelFetch<Connector>(`/v1/connect/connectors/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function deleteConnector(id: string): Promise<void> {
  await vercelFetch<void>(`/v1/connect/connectors/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/* ---------------------------------------------------------------------- */
/* Projects and Passport                                                   */
/* ---------------------------------------------------------------------- */

export async function listProjects(limit = 100): Promise<Project[]> {
  const data = await vercelFetch<{ projects?: Project[] }>(`/v9/projects?limit=${limit}`)
  return (data.projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework ?? null,
    updatedAt: p.updatedAt,
    passport: p.passport ?? null,
  }))
}

export async function getProject(idOrName: string): Promise<Project> {
  const p = await vercelFetch<Project>(`/v9/projects/${encodeURIComponent(idOrName)}`)
  return {
    id: p.id,
    name: p.name,
    framework: p.framework ?? null,
    updatedAt: p.updatedAt,
    passport: p.passport ?? null,
  }
}

/** Points a project's Passport at a connector, or clears it with `null`. */
export async function setProjectPassport(
  idOrName: string,
  passport: { connectorId: string; deploymentType: DeploymentType } | null,
): Promise<Project> {
  const p = await vercelFetch<Project>(`/v9/projects/${encodeURIComponent(idOrName)}`, {
    method: "PATCH",
    body: JSON.stringify({ passport }),
  })
  return { id: p.id, name: p.name, framework: p.framework ?? null, updatedAt: p.updatedAt, passport: p.passport ?? null }
}
