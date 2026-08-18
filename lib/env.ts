import "server-only"

/**
 * Server-side configuration. Everything here is read lazily so the app can
 * render an honest "not configured" state instead of crashing at import time.
 */

function read(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value.trim() : undefined
}

/**
 * The Okta org base URL, normalized.
 *
 * Okta hands admins a `*-admin.okta.com` console URL, but the Management API
 * and the OIDC endpoints only live on the plain org domain — calls to the
 * admin host fail or redirect. We strip the `-admin` suffix so either value
 * the operator pastes in works.
 */
export function oktaOrgUrl(): string | undefined {
  const raw = read("OKTA_ORG_URL")
  if (!raw) return undefined
  const withScheme = raw.startsWith("http") ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    url.hostname = url.hostname.replace(/-admin(\.okta(preview)?\.com)$/i, "$1")
    return `${url.protocol}//${url.host}`
  } catch {
    return withScheme.replace(/\/+$/, "")
  }
}

/** True when OKTA_PRIVATE_JWK still holds the documentation placeholder. */
export function oktaJwkLooksPlaceholder(): boolean {
  const raw = oktaPrivateJwk()
  if (!raw) return false
  try {
    const jwk = JSON.parse(raw) as Record<string, unknown>
    // A real RSA private key has a long modulus and private exponent.
    const n = typeof jwk.n === "string" ? jwk.n : ""
    const d = typeof jwk.d === "string" ? jwk.d : ""
    return n.length < 64 || d.length < 64
  } catch {
    return false
  }
}

export const oktaClientId = () => read("OKTA_CLIENT_ID")
export const oktaPrivateJwk = () => read("OKTA_PRIVATE_JWK")
export const oktaApiToken = () => read("OKTA_API_TOKEN")

export const vercelApiToken = () => read("VERCEL_API_TOKEN")
export const vercelTeamId = () => read("VERCEL_TEAM_ID")

export const serviceApiKey = () => read("SERVICE_API_KEY")

export type ConfigCheck = {
  key: string
  present: boolean
  required: boolean
  note: string
}

/** Which credentials are present. Never returns the values themselves. */
export function configStatus(): ConfigCheck[] {
  const hasJwk = Boolean(oktaClientId() && oktaPrivateJwk())
  return [
    {
      key: "OKTA_ORG_URL",
      present: Boolean(oktaOrgUrl()),
      required: true,
      note: "Okta org base URL, e.g. https://acme.okta.com",
    },
    {
      key: "OKTA_CLIENT_ID",
      present: Boolean(oktaClientId()),
      required: !oktaApiToken(),
      note: "API Services app client id (private_key_jwt)",
    },
    {
      key: "OKTA_PRIVATE_JWK",
      // A placeholder is worse than nothing — it fails at signing time.
      present: Boolean(oktaPrivateJwk()) && !oktaJwkLooksPlaceholder(),
      required: !oktaApiToken(),
      note: oktaJwkLooksPlaceholder()
        ? "Currently a placeholder — paste the real private JWK from Okta"
        : "Private JWK used to sign the client assertion",
    },
    {
      key: "OKTA_API_TOKEN",
      present: Boolean(oktaApiToken()),
      required: false,
      note: "Legacy SSWS token — only used when no JWK is configured",
    },
    {
      key: "VERCEL_API_TOKEN",
      present: Boolean(vercelApiToken()),
      required: true,
      note: "Vercel access token with team scope",
    },
    {
      key: "VERCEL_TEAM_ID",
      present: Boolean(vercelTeamId()),
      required: true,
      note: "Team the connectors and projects belong to",
    },
    {
      key: "SERVICE_API_KEY",
      present: Boolean(serviceApiKey()),
      required: true,
      note: "Shared key callers send as x-api-key",
    },
  ].map((c) => (hasJwk && c.key === "OKTA_API_TOKEN" ? { ...c, required: false } : c))
}

export function missingRequired(): string[] {
  return configStatus()
    .filter((c) => c.required && !c.present)
    .map((c) => c.key)
}
