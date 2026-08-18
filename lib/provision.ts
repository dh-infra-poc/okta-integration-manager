import "server-only"

import { ServiceError } from "@/lib/errors"
import { getApp, getAppClientSecret } from "@/lib/okta"
import type { CreateConnectorBody } from "@/lib/schema"
import { createOAuthConnector, type Connector } from "@/lib/vercel"

/**
 * Creates a Vercel Connect connector, resolving the OIDC credentials from a
 * managed Okta app when `oktaAppId` is supplied. This is the join between the
 * two systems: Okta owns the identity, Connect owns the token exchange.
 */
export async function createConnectorFromInput(input: CreateConnectorBody): Promise<Connector> {
  let { issuer, clientId, clientSecret } = input
  let service = input.service

  if (input.oktaAppId) {
    const app = await getApp(input.oktaAppId)
    if (!app.clientId) {
      throw new ServiceError(
        400,
        "okta_app_not_oidc",
        `Okta app "${app.label}" is not an OIDC client, so it cannot back a connector`,
      )
    }

    // Okta never returns client_secret on the app object; it lives in a
    // separate secrets collection and must be fetched explicitly.
    const secret = await getAppClientSecret(input.oktaAppId)
    if (!secret) {
      throw new ServiceError(
        400,
        "okta_app_no_secret",
        `Okta app "${app.label}" has no active client secret. Connect needs a confidential client — generate a secret on the app, or pass clientSecret explicitly.`,
      )
    }

    clientId = app.clientId
    clientSecret = secret
    issuer = app.issuer
    // Group Connect connectors under the Okta org's hostname by default.
    service = service ?? (issuer ? new URL(issuer).hostname : "okta.com")
  }

  if (!issuer || !clientId || !clientSecret) {
    throw new ServiceError(400, "bad_request", "Missing issuer, clientId, or clientSecret for the connector")
  }

  return createOAuthConnector({
    name: input.name,
    service,
    uid: input.uid,
    issuer,
    clientId,
    clientSecret,
    scopes: input.scopes,
    forwardedClaims: input.forwardedClaims,
    tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
  })
}
