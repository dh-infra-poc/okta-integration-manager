import { handler, parseBody } from "@/lib/api"
import { passportSchema } from "@/lib/schema"
import { getConnector, getProject, setProjectPassport } from "@/lib/vercel"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ projectId: string }> }

export const GET = handler<Ctx>(async (_request, { params }) => {
  const { projectId } = await params
  const project = await getProject(projectId)
  return { project: { id: project.id, name: project.name }, passport: project.passport }
})

/** Points the project's Passport at a connector. */
export const PUT = handler<Ctx>(async (request, { params }) => {
  const { projectId } = await params
  const body = await parseBody(request, passportSchema)

  // Fail early with a clear message if the connector id is wrong.
  await getConnector(body.connectorId)

  const project = await setProjectPassport(projectId, body)
  return { project: { id: project.id, name: project.name }, passport: project.passport }
})

/** Removes Passport protection from the project. */
export const DELETE = handler<Ctx>(async (_request, { params }) => {
  const { projectId } = await params
  const project = await setProjectPassport(projectId, null)
  return { project: { id: project.id, name: project.name }, passport: project.passport }
})
