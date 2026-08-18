import "server-only"

import { getIdentity } from "@vercel/passport"

import { serviceApiKey } from "@/lib/env"
import { unauthorized } from "@/lib/errors"

/**
 * Two doors into the same service:
 *
 *  - Machines call `/api/*` with `x-api-key: $SERVICE_API_KEY`.
 *  - Humans use the UI, which is gated by Vercel Passport on the deployment.
 *
 * The UI never sends the API key from the browser — its Server Components and
 * Server Actions call the same `lib/` functions the API routes call.
 */

/** Constant-time-ish comparison so the key can't be probed by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Throws unless the request carries the shared service key. */
export function requireApiKey(request: Request): void {
  const expected = serviceApiKey()
  if (!expected) {
    throw unauthorized("SERVICE_API_KEY is not configured, so the API is closed")
  }

  const header = request.headers.get("x-api-key")
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const provided = header || bearer

  if (!provided || !safeEqual(provided, expected)) {
    throw unauthorized()
  }
}

export type Viewer = {
  subject: string
  email?: string
  name?: string
  verified: boolean
  source: string
}

/**
 * The Passport identity behind the UI. Returns undefined when the deployment
 * is not Passport-protected, so the UI can say so rather than pretend.
 */
export async function currentViewer(): Promise<Viewer | undefined> {
  try {
    const identity = await getIdentity()
    if (!identity) return undefined
    return {
      subject: identity.externalSubject || identity.subject,
      email: identity.email,
      name: identity.name,
      verified: Boolean(identity.verified),
      source: identity.tokenSource ?? "unknown",
    }
  } catch {
    return undefined
  }
}
