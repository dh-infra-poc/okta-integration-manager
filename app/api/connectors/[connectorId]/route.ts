import { handler, parseBody } from "@/lib/api"
import { ServiceError } from "@/lib/errors"
import { updateConnectorSchema } from "@/lib/schema"
import { deleteConnector, getConnector, listProjects, updateConnector } from "@/lib/vercel"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ connectorId: string }> }

export const GET = handler<Ctx>(async (_request, { params }) => {
  const { connectorId } = await params
  const [connector, projects] = await Promise.all([getConnector(connectorId), listProjects()])
  return {
    connector: {
      ...connector,
      attachedProjects: projects
        .filter((p) => p.passport?.connectorId === connector.id)
        .map((p) => ({ id: p.id, name: p.name, deploymentType: p.passport?.deploymentType ?? "all" })),
    },
  }
})

export const PATCH = handler<Ctx>(async (request, { params }) => {
  const { connectorId } = await params
  const body = await parseBody(request, updateConnectorSchema)
  return { connector: await updateConnector(connectorId, body) }
})

export const DELETE = handler<Ctx>(async (_request, { params }) => {
  const { connectorId } = await params

  // Refuse to orphan a Passport config — the project would lose its gate.
  const projects = await listProjects()
  const attached = projects.filter((p) => p.passport?.connectorId === connectorId)
  if (attached.length > 0) {
    throw new ServiceError(
      409,
      "connector_in_use",
      `This connector still gates ${attached.length} project(s): ${attached.map((p) => p.name).join(", ")}. Detach Passport first.`,
      { projects: attached.map((p) => ({ id: p.id, name: p.name })) },
    )
  }

  await deleteConnector(connectorId)
  return undefined
})
