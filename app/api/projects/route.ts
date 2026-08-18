import { handler } from "@/lib/api"
import { listProjects } from "@/lib/vercel"

export const dynamic = "force-dynamic"

export const GET = handler(async () => {
  return { projects: await listProjects() }
})
