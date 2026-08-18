import { handler } from "@/lib/api"
import { searchGroups } from "@/lib/okta"

export const dynamic = "force-dynamic"

export const GET = handler(async (request) => {
  const url = new URL(request.url)
  return {
    groups: await searchGroups(url.searchParams.get("q") ?? undefined, Number(url.searchParams.get("limit") ?? 20)),
  }
})
