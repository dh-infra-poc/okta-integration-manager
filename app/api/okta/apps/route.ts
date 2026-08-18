import { handler, parseBody } from "@/lib/api"
import { createApp, listApps, redactApp } from "@/lib/okta"
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
  // The secret is returned exactly once, on create, so the caller can store it.
  return { app: redactApp(app), clientSecret: app.clientSecret ?? null }
})
