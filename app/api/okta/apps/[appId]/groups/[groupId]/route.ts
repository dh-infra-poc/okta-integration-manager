import { handler } from "@/lib/api"
import { removeGroup } from "@/lib/okta"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ appId: string; groupId: string }> }

export const DELETE = handler<Ctx>(async (_request, { params }) => {
  const { appId, groupId } = await params
  await removeGroup(appId, groupId)
  return undefined
})
