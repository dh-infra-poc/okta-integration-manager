import { handler, parseBody } from "@/lib/api"
import { deleteApp, getApp, redactApp, setAppStatus, updateApp } from "@/lib/okta"
import { updateAppSchema } from "@/lib/schema"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ appId: string }> }

export const GET = handler<Ctx>(async (_request, { params }) => {
  const { appId } = await params
  return { app: redactApp(await getApp(appId)) }
})

export const PATCH = handler<Ctx>(async (request, { params }) => {
  const { appId } = await params
  const { status, ...rest } = await parseBody(request, updateAppSchema)

  if (Object.keys(rest).length > 0) {
    await updateApp(appId, rest)
  }
  if (status) {
    await setAppStatus(appId, status === "ACTIVE" ? "activate" : "deactivate")
  }

  return { app: redactApp(await getApp(appId)) }
})

export const DELETE = handler<Ctx>(async (_request, { params }) => {
  const { appId } = await params
  await deleteApp(appId)
  return undefined
})
