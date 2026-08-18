import { handler, parseBody } from "@/lib/api"
import { createConnectorFromInput } from "@/lib/provision"
import { createConnectorSchema } from "@/lib/schema"
import { listConnectorsWithAttachments } from "@/lib/vercel"

export const dynamic = "force-dynamic"

export const GET = handler(async () => {
  return { connectors: await listConnectorsWithAttachments() }
})

export const POST = handler(async (request) => {
  const body = await parseBody(request, createConnectorSchema)
  return { connector: await createConnectorFromInput(body) }
})
