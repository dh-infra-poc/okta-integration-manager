import { handler, parseBody } from "@/lib/api"
import { createApp, getAppClientSecret, listApps, redactApp } from "@/lib/okta"
import { createAppSchema } from "@/lib/schema"

export const dynamic = "force-dynamic"

export const GET = handler(async (request) => {
  const url = new URL(request.url)
  const apps = await listApps({
    query: url.searchParams.get("q") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  })
  return { apps: apps.map(redactApp) }
})

export const POST = handler(async (request) => {
  const body = await parseBody(request, createAppSchema)
  const app = await createApp(body)
  // Okta omits the secret from the create response too, so read it from the
  // secrets collection. Returned here — and only here — so the caller can
  // store it; every other endpoint redacts it.
  const clientSecret = await getAppClientSecret(app.id).catch(() => undefined)
  return { app: redactApp(app), clientSecret: clientSecret ?? null }
})
