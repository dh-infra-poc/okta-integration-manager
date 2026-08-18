"use server"

import { revalidatePath } from "next/cache"

import { errorMessage } from "@/lib/errors"
import {
  assignGroup,
  assignUser,
  createApp,
  deleteApp,
  removeGroup,
  removeUser,
  setAppStatus,
  updateApp,
} from "@/lib/okta"
import type { DeploymentType } from "@/lib/passport-types"
import { createConnectorFromInput } from "@/lib/provision"
import { CONNECT_CALLBACK_URL } from "@/lib/schema"
import { deleteConnector, listProjects, setProjectPassport } from "@/lib/vercel"

/**
 * Server Actions for the UI. They call the exact same `lib/` functions the
 * REST API calls, so the two surfaces can never drift apart.
 */

export type ActionState = { ok?: string; error?: string } | null

const fail = (error: unknown): ActionState => ({ error: errorMessage(error) })

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/* ------------------------------- Okta apps ------------------------------ */

export async function createAppAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const label = String(formData.get("label") ?? "").trim()
  if (!label) return { error: "A label is required" }

  const redirectUris = lines(formData.get("redirectUris"))
  try {
    const app = await createApp({
      label,
      redirectUris: redirectUris.length > 0 ? redirectUris : [CONNECT_CALLBACK_URL],
      postLogoutRedirectUris: lines(formData.get("postLogoutRedirectUris")),
    })
    revalidatePath("/apps")
    return { ok: `Created "${app.label}" (${app.clientId})` }
  } catch (error) {
    return fail(error)
  }
}

export async function updateAppAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const appId = String(formData.get("appId") ?? "")
  try {
    await updateApp(appId, {
      label: String(formData.get("label") ?? "").trim() || undefined,
      redirectUris: lines(formData.get("redirectUris")),
      postLogoutRedirectUris: lines(formData.get("postLogoutRedirectUris")),
    })
    revalidatePath(`/apps/${appId}`)
    return { ok: "Application updated" }
  } catch (error) {
    return fail(error)
  }
}

export async function setAppStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const appId = String(formData.get("appId") ?? "")
  const next = String(formData.get("next") ?? "") as "activate" | "deactivate"
  try {
    await setAppStatus(appId, next)
    revalidatePath(`/apps/${appId}`)
    revalidatePath("/apps")
    return { ok: next === "activate" ? "Application activated" : "Application deactivated" }
  } catch (error) {
    return fail(error)
  }
}

export async function deleteAppAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const appId = String(formData.get("appId") ?? "")
  try {
    await deleteApp(appId)
    revalidatePath("/apps")
    return { ok: "Application deleted" }
  } catch (error) {
    return fail(error)
  }
}

/* ------------------------------ Assignments ----------------------------- */

export async function assignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const appId = String(formData.get("appId") ?? "")
  const kind = String(formData.get("kind") ?? "group")
  const id = String(formData.get("id") ?? "").trim()
  if (!id) return { error: "Choose someone to assign" }

  try {
    if (kind === "user") await assignUser(appId, id)
    else await assignGroup(appId, id)
    revalidatePath(`/apps/${appId}`)
    return { ok: kind === "user" ? "User assigned" : "Group assigned" }
  } catch (error) {
    return fail(error)
  }
}

export async function unassignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const appId = String(formData.get("appId") ?? "")
  const kind = String(formData.get("kind") ?? "group")
  const id = String(formData.get("id") ?? "")

  try {
    if (kind === "user") await removeUser(appId, id)
    else await removeGroup(appId, id)
    revalidatePath(`/apps/${appId}`)
    return { ok: kind === "user" ? "User removed" : "Group removed" }
  } catch (error) {
    return fail(error)
  }
}

/* ------------------------------ Connectors ------------------------------ */

export async function createConnectorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim()
  const oktaAppId = String(formData.get("oktaAppId") ?? "").trim()
  if (!name) return { error: "A connector name is required" }
  if (!oktaAppId) return { error: "Choose the Okta application to back this connector" }

  try {
    const connector = await createConnectorFromInput({
      name,
      oktaAppId,
      scopes: lines(formData.get("scopes")),
      forwardedClaims: lines(formData.get("forwardedClaims")),
    })
    revalidatePath("/connectors")
    return { ok: `Created connector ${connector.uid} (${connector.id})` }
  } catch (error) {
    return fail(error)
  }
}

export async function deleteConnectorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const connectorId = String(formData.get("connectorId") ?? "")
  try {
    const projects = await listProjects()
    const attached = projects.filter((p) => p.passport?.connectorId === connectorId)
    if (attached.length > 0) {
      return {
        error: `Still gating ${attached.map((p) => p.name).join(", ")}. Detach Passport first.`,
      }
    }
    await deleteConnector(connectorId)
    revalidatePath("/connectors")
    return { ok: "Connector deleted" }
  } catch (error) {
    return fail(error)
  }
}

/* -------------------------------- Passport ------------------------------ */

export async function setPassportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = String(formData.get("projectId") ?? "")
  const connectorId = String(formData.get("connectorId") ?? "").trim()
  const deploymentType = (String(formData.get("deploymentType") ?? "all") || "all") as DeploymentType

  try {
    if (!connectorId) {
      await setProjectPassport(projectId, null)
      revalidatePath("/projects")
      revalidatePath("/connectors")
      return { ok: "Passport removed from the project" }
    }
    await setProjectPassport(projectId, { connectorId, deploymentType })
    revalidatePath("/projects")
    revalidatePath("/connectors")
    return { ok: "Passport applied" }
  } catch (error) {
    return fail(error)
  }
}
