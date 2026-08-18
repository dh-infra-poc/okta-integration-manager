import { handler } from "@/lib/api"
import { removeUser } from "@/lib/okta"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ appId: string; userId: string }> }

export const DELETE = handler<Ctx>(async (_request, { params }) => {
  const { appId, userId } = await params
  await removeUser(appId, userId)
  return undefined
})
