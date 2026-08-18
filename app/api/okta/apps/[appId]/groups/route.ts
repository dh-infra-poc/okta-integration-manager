import { handler, parseBody } from "@/lib/api"
import { assignGroup, listAppGroups } from "@/lib/okta"
import { assignmentSchema } from "@/lib/schema"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ appId: string }> }

export const GET = handler<Ctx>(async (_request, { params }) => {
  const { appId } = await params
  return { groups: await listAppGroups(appId) }
})

export const POST = handler<Ctx>(async (request, { params }) => {
  const { appId } = await params
  const { id } = await parseBody(request, assignmentSchema)
  await assignGroup(appId, id)
  return { groups: await listAppGroups(appId) }
})
