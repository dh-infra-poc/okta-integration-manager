import "server-only"

import { oktaAuthMode, oktaOrgUrl } from "@/lib/env"
import { ServiceError, notConfigured } from "@/lib/errors"
import { invalidateOktaToken, oktaAuthHeader } from "@/lib/okta-token"

/* ---------------------------------------------------------------------- */
/* Types                                                                   */
/* ---------------------------------------------------------------------- */

export type OktaAppStatus = "ACTIVE" | "INACTIVE"

export type OktaApp = {
  id: string
  label: string
  status: OktaAppStatus
  signOnMode: string
  created?: string
  lastUpdated?: string
  clientId?: string
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  grantTypes: string[]
  responseTypes: string[]
  applicationType?: string
  tokenEndpointAuthMethod?: string
  loginUrl?: string
  /** The org-level issuer these credentials authenticate against. */
  issuer?: string
}

export type OktaAssignment = {
  id: string
  type: "group" | "user"
  name: string
  secondary?: string
  created?: string
}

export type OktaGroup = { id: string; name: string; description?: string; type?: string }
export type OktaUser = { id: string; login: string; name: string; status: string }

/* ---------------------------------------------------------------------- */
/* Transport                                                               */
/* ---------------------------------------------------------------------- */

type RawApp = {
  id: string
  label: string
  status: OktaAppStatus
  signOnMode: string
  created?: string
  lastUpdated?: string
  credentials?: { oauthClient?: { client_id?: string; client_secret?: string; token_endpoint_auth_method?: string } }
  settings?: {
    oauthClient?: {
      redirect_uris?: string[]
      post_logout_redirect_uris?: string[]
      grant_types?: string[]
      response_types?: string[]
      application_type?: string
    }
    signOn?: { loginUrl?: string }
  }
}

async function oktaFetch<T>(
  path: string,
  init: RequestInit & { retryOn401?: boolean } = {},
): Promise<{ data: T; headers: Headers }> {
  const orgUrl = oktaOrgUrl()
  if (!orgUrl) throw notConfigured(["OKTA_ORG_URL"])

  const { retryOn401 = true, ...rest } = init
  const send = async () => {
    const authorization = await oktaAuthHeader()
    return fetch(`${orgUrl}${path}`, {
      ...rest,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization,
        ...(rest.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    })
  }

  let res = await send()
  // Only worth retrying when we mint our own token — a 401 there usually means
  // the cached access token was revoked early. An SSWS token is static, so a
  // retry would just replay the same rejected request.
  if (res.status === 401 && retryOn401 && oktaAuthMode() === "jwt") {
    invalidateOktaToken()
    res = await send()
  }

  if (res.status === 204) return { data: undefined as T, headers: res.headers }

  const text = await res.text()
  const json = text ? JSON.parse(text) : undefined

  if (!res.ok) {
    const summary =
      json?.errorCauses?.[0]?.errorSummary || json?.errorSummary || `Okta request failed (${res.status})`
    throw new ServiceError(res.status === 404 ? 404 : res.status >= 500 ? 502 : res.status, "okta_error", summary, {
      errorCode: json?.errorCode,
      path,
    })
  }

  return { data: json as T, headers: res.headers }
}

/* ---------------------------------------------------------------------- */
/* Mapping                                                                 */
/* ---------------------------------------------------------------------- */

function mapApp(raw: RawApp): OktaApp {
  const oauth = raw.settings?.oauthClient
  return {
    id: raw.id,
    label: raw.label,
    status: raw.status,
    signOnMode: raw.signOnMode,
    created: raw.created,
    lastUpdated: raw.lastUpdated,
    clientId: raw.credentials?.oauthClient?.client_id,
    // NB: Okta never returns client_secret here. Use getAppClientSecret().
    tokenEndpointAuthMethod: raw.credentials?.oauthClient?.token_endpoint_auth_method,
    redirectUris: oauth?.redirect_uris ?? [],
    postLogoutRedirectUris: oauth?.post_logout_redirect_uris ?? [],
    grantTypes: oauth?.grant_types ?? [],
    responseTypes: oauth?.response_types ?? [],
    applicationType: oauth?.application_type,
    loginUrl: raw.settings?.signOn?.loginUrl,
    issuer: oktaOrgUrl(),
  }
}

/**
 * Marks an app as safe to serialize to a client.
 *
 * `OktaApp` no longer carries a secret at all — Okta keeps secrets in a
 * separate collection reachable only via `getAppClientSecret`. This stays as
 * the single, explicit boundary every response passes through, so if a
 * sensitive field is ever added to the type there is one obvious place to
 * strip it.
 */
export function redactApp(app: OktaApp): OktaApp {
  return app
}

/* ---------------------------------------------------------------------- */
/* Apps                                                                    */
/* ---------------------------------------------------------------------- */

export async function listApps(options: { query?: string; limit?: number } = {}): Promise<OktaApp[]> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 50) })
  if (options.query) params.set("q", options.query)
  const { data } = await oktaFetch<RawApp[]>(`/api/v1/apps?${params.toString()}`)
  return (data ?? []).map(mapApp)
}

export async function getApp(id: string): Promise<OktaApp> {
  const { data } = await oktaFetch<RawApp>(`/api/v1/apps/${encodeURIComponent(id)}`)
  return mapApp(data)
}

/**
 * Reads an app's active client secret.
 *
 * Okta deliberately omits `client_secret` from the app object — GET /apps/{id}
 * only ever returns the client_id — and serves secrets from a separate
 * collection. An app may hold several; we want the ACTIVE one.
 *
 * Returns undefined for apps that legitimately have no secret (public clients,
 * or private_key_jwt apps), which the caller must distinguish from an error.
 */
export async function getAppClientSecret(id: string): Promise<string | undefined> {
  type RawSecret = { id: string; status?: string; client_secret?: string }
  const { data } = await oktaFetch<RawSecret[]>(
    `/api/v1/apps/${encodeURIComponent(id)}/credentials/secrets`,
  )
  const secrets = data ?? []
  const active = secrets.find((s) => s.status === "ACTIVE" && s.client_secret)
  return (active ?? secrets.find((s) => s.client_secret))?.client_secret
}

export type CreateAppInput = {
  label: string
  redirectUris: string[]
  postLogoutRedirectUris?: string[]
  grantTypes?: string[]
  responseTypes?: string[]
  applicationType?: "web" | "browser" | "native" | "service"
}

export async function createApp(input: CreateAppInput): Promise<OktaApp> {
  const grantTypes = input.grantTypes?.length ? input.grantTypes : ["authorization_code", "refresh_token"]
  const responseTypes = input.responseTypes?.length ? input.responseTypes : ["code"]

  const body = {
    name: "oidc_client",
    label: input.label,
    signOnMode: "OPENID_CONNECT",
    credentials: {
      oauthClient: { token_endpoint_auth_method: "client_secret_basic" },
    },
    settings: {
      oauthClient: {
        application_type: input.applicationType ?? "web",
        grant_types: grantTypes,
        response_types: responseTypes,
        redirect_uris: input.redirectUris,
        post_logout_redirect_uris: input.postLogoutRedirectUris ?? [],
        consent_method: "REQUIRED",
      },
    },
  }

  const { data } = await oktaFetch<RawApp>("/api/v1/apps", { method: "POST", body: JSON.stringify(body) })
  return mapApp(data)
}

export type UpdateAppInput = Partial<Omit<CreateAppInput, "applicationType">>

export async function updateApp(id: string, input: UpdateAppInput): Promise<OktaApp> {
  const current = await getApp(id)
  const body = {
    name: "oidc_client",
    label: input.label ?? current.label,
    signOnMode: "OPENID_CONNECT",
    credentials: {
      oauthClient: {
        client_id: current.clientId,
        token_endpoint_auth_method: current.tokenEndpointAuthMethod ?? "client_secret_basic",
      },
    },
    settings: {
      oauthClient: {
        application_type: current.applicationType ?? "web",
        grant_types: input.grantTypes ?? current.grantTypes,
        response_types: input.responseTypes ?? current.responseTypes,
        redirect_uris: input.redirectUris ?? current.redirectUris,
        post_logout_redirect_uris: input.postLogoutRedirectUris ?? current.postLogoutRedirectUris,
      },
    },
  }
  const { data } = await oktaFetch<RawApp>(`/api/v1/apps/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
  return mapApp(data)
}

export async function setAppStatus(id: string, status: "activate" | "deactivate"): Promise<void> {
  await oktaFetch<void>(`/api/v1/apps/${encodeURIComponent(id)}/lifecycle/${status}`, { method: "POST" })
}

/** Okta refuses to delete an active app, so deactivate first. */
export async function deleteApp(id: string): Promise<void> {
  const app = await getApp(id).catch(() => undefined)
  if (app?.status === "ACTIVE") {
    await setAppStatus(id, "deactivate")
  }
  await oktaFetch<void>(`/api/v1/apps/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/* ---------------------------------------------------------------------- */
/* Assignments                                                             */
/* ---------------------------------------------------------------------- */

export async function listAppGroups(appId: string): Promise<OktaAssignment[]> {
  const { data } = await oktaFetch<Array<{ id: string; created?: string; lastUpdated?: string }>>(
    `/api/v1/apps/${encodeURIComponent(appId)}/groups?limit=200`,
  )
  const rows = data ?? []
  // The assignment payload carries only the group id, so resolve names in parallel.
  const resolved = await Promise.all(
    rows.map(async (row) => {
      const group = await getGroup(row.id).catch(() => undefined)
      return {
        id: row.id,
        type: "group" as const,
        name: group?.name ?? row.id,
        secondary: group?.description || group?.type,
        created: row.created,
      }
    }),
  )
  return resolved
}

export async function assignGroup(appId: string, groupId: string): Promise<void> {
  await oktaFetch<unknown>(
    `/api/v1/apps/${encodeURIComponent(appId)}/groups/${encodeURIComponent(groupId)}`,
    { method: "PUT", body: JSON.stringify({}) },
  )
}

export async function removeGroup(appId: string, groupId: string): Promise<void> {
  await oktaFetch<void>(`/api/v1/apps/${encodeURIComponent(appId)}/groups/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
  })
}

type RawAppUser = {
  id: string
  created?: string
  status?: string
  credentials?: { userName?: string }
  profile?: { email?: string }
  _embedded?: { user?: { profile?: { firstName?: string; lastName?: string; login?: string; email?: string } } }
}

export async function listAppUsers(appId: string): Promise<OktaAssignment[]> {
  const { data } = await oktaFetch<RawAppUser[]>(
    `/api/v1/apps/${encodeURIComponent(appId)}/users?limit=200&expand=user`,
  )
  return (data ?? []).map((row) => {
    const profile = row._embedded?.user?.profile
    const displayName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : ""
    return {
      id: row.id,
      type: "user" as const,
      name: displayName || row.credentials?.userName || profile?.login || row.id,
      secondary: row.credentials?.userName || profile?.email || profile?.login,
      created: row.created,
    }
  })
}

export async function assignUser(appId: string, userId: string): Promise<void> {
  await oktaFetch<unknown>(`/api/v1/apps/${encodeURIComponent(appId)}/users`, {
    method: "POST",
    body: JSON.stringify({ id: userId }),
  })
}

export async function removeUser(appId: string, userId: string): Promise<void> {
  await oktaFetch<void>(`/api/v1/apps/${encodeURIComponent(appId)}/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  })
}

/* ---------------------------------------------------------------------- */
/* Directory lookups (for the assignment pickers)                          */
/* ---------------------------------------------------------------------- */

export async function getGroup(id: string): Promise<OktaGroup> {
  const { data } = await oktaFetch<{ id: string; type?: string; profile?: { name?: string; description?: string } }>(
    `/api/v1/groups/${encodeURIComponent(id)}`,
  )
  return { id: data.id, name: data.profile?.name ?? data.id, description: data.profile?.description, type: data.type }
}

export async function searchGroups(query?: string, limit = 20): Promise<OktaGroup[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (query) params.set("q", query)
  const { data } = await oktaFetch<Array<{ id: string; type?: string; profile?: { name?: string; description?: string } }>>(
    `/api/v1/groups?${params.toString()}`,
  )
  return (data ?? []).map((g) => ({
    id: g.id,
    name: g.profile?.name ?? g.id,
    description: g.profile?.description,
    type: g.type,
  }))
}

export async function searchUsers(query?: string, limit = 20): Promise<OktaUser[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (query) params.set("q", query)
  const { data } = await oktaFetch<
    Array<{ id: string; status: string; profile?: { login?: string; email?: string; firstName?: string; lastName?: string } }>
  >(`/api/v1/users?${params.toString()}`)
  return (data ?? []).map((u) => ({
    id: u.id,
    login: u.profile?.login ?? u.profile?.email ?? u.id,
    name: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || (u.profile?.login ?? u.id),
    status: u.status,
  }))
}
