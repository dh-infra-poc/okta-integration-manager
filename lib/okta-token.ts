import "server-only"

import { SignJWT, importJWK, type JWK } from "jose"

import { oktaApiToken, oktaClientId, oktaOrgUrl, oktaPrivateJwk } from "@/lib/env"
import { ServiceError, notConfigured } from "@/lib/errors"

/**
 * Okta Management API authorization.
 *
 * Preferred path: an API Services (machine-to-machine) app using
 * private_key_jwt. We sign a client assertion with the configured private JWK
 * and exchange it at the ORG authorization server (`/oauth2/v1/token`) — never
 * `/oauth2/default`, which cannot issue Management API scopes.
 *
 * Fallback: a classic SSWS API token, if that is all the operator configured.
 */

export const OKTA_SCOPES = [
  "okta.apps.manage",
  "okta.apps.read",
  "okta.users.read",
  "okta.groups.read",
] as const

type CachedToken = { value: string; expiresAt: number }

// Module-scope cache. Tokens live an hour; we refresh a minute early.
let cached: CachedToken | undefined

function parseJwk(raw: string): JWK {
  let text = raw
  // Tolerate a base64-encoded JWK, which is easier to paste into env UIs.
  if (!text.trim().startsWith("{")) {
    try {
      text = Buffer.from(text, "base64").toString("utf8")
    } catch {
      throw new ServiceError(500, "bad_okta_jwk", "OKTA_PRIVATE_JWK is not valid JSON or base64 JSON")
    }
  }
  let jwk: JWK
  try {
    jwk = JSON.parse(text) as JWK
  } catch {
    throw new ServiceError(500, "bad_okta_jwk", "OKTA_PRIVATE_JWK could not be parsed as JSON")
  }

  // Catch the pasted-the-example case before jose fails with "Invalid keyData".
  if (!jwk.d || (typeof jwk.n === "string" && jwk.n.length < 64)) {
    throw new ServiceError(
      503,
      "okta_jwk_placeholder",
      "OKTA_PRIVATE_JWK is a placeholder, not a real private key. Generate a key pair on your Okta API Services app and paste the private JWK.",
    )
  }

  return jwk
}

async function mintClientAssertion(orgUrl: string, clientId: string, jwkRaw: string) {
  const jwk = parseJwk(jwkRaw)
  const alg = (jwk.alg as string) || "RS256"
  const key = await importJWK(jwk, alg)
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({})
    .setProtectedHeader({ alg, ...(jwk.kid ? { kid: jwk.kid } : {}) })
    .setIssuer(clientId)
    .setSubject(clientId)
    .setAudience(`${orgUrl}/oauth2/v1/token`)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .setJti(crypto.randomUUID())
    .sign(key)
}

async function fetchAccessToken(): Promise<CachedToken> {
  const orgUrl = oktaOrgUrl()
  const clientId = oktaClientId()
  const jwkRaw = oktaPrivateJwk()
  if (!orgUrl || !clientId || !jwkRaw) {
    throw notConfigured(
      [!orgUrl && "OKTA_ORG_URL", !clientId && "OKTA_CLIENT_ID", !jwkRaw && "OKTA_PRIVATE_JWK"].filter(
        Boolean,
      ) as string[],
    )
  }

  const assertion = await mintClientAssertion(orgUrl, clientId, jwkRaw)
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: OKTA_SCOPES.join(" "),
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: assertion,
  })

  const res = await fetch(`${orgUrl}/oauth2/v1/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
    cache: "no-store",
  })

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!res.ok || !json.access_token) {
    throw new ServiceError(
      res.status === 401 || res.status === 400 ? 502 : res.status,
      "okta_token_error",
      json.error_description || json.error || `Okta rejected the token request (${res.status})`,
      { status: res.status },
    )
  }

  return {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
  }
}

/** Returns the Authorization header value for a Management API call. */
export async function oktaAuthHeader(): Promise<string> {
  if (oktaClientId() && oktaPrivateJwk()) {
    if (!cached || cached.expiresAt <= Date.now()) {
      cached = await fetchAccessToken()
    }
    return `Bearer ${cached.value}`
  }

  const ssws = oktaApiToken()
  if (ssws) return `SSWS ${ssws}`

  throw notConfigured(["OKTA_CLIENT_ID", "OKTA_PRIVATE_JWK"])
}

/** Drops the cached token — used after a 401 so the next call re-mints. */
export function invalidateOktaToken() {
  cached = undefined
}
