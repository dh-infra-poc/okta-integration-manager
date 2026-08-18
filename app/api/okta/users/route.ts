import { handler } from "@/lib/api"
import { searchUsers } from "@/lib/okta"

export const dynamic = "force-dynamic"

export const GET = handler(async (request) => {
  const url = new URL(request.url)
  return {
    users: await searchUsers(url.searchParams.get("q") ?? undefined, Number(url.searchParams.get("limit") ?? 20)),
  }
})
