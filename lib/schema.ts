import { z } from "zod"

import { DEPLOYMENT_TYPES } from "@/lib/passport-types"

/** The redirect URI every Vercel Connect connector authorizes against. */
export const CONNECT_CALLBACK_URL = "https://connect.vercel.com/callback"

const httpsUrl = z
  .string()
  .trim()
  .min(1)
  .refine((v) => /^https?:\/\//.test(v), { message: "Must be an absolute http(s) URL" })

export const createAppSchema = z.object({
  label: z.string().trim().min(1, "A label is required").max(100),
  redirectUris: z.array(httpsUrl).min(1, "At least one redirect URI is required").default([CONNECT_CALLBACK_URL]),
  postLogoutRedirectUris: z.array(httpsUrl).optional(),
  grantTypes: z.array(z.string()).optional(),
  responseTypes: z.array(z.string()).optional(),
  applicationType: z.enum(["web", "browser", "native", "service"]).optional(),
})

export const updateAppSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  redirectUris: z.array(httpsUrl).min(1).optional(),
  postLogoutRedirectUris: z.array(httpsUrl).optional(),
  grantTypes: z.array(z.string()).optional(),
  responseTypes: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

/**
 * Body for assigning a group or user to an app.
 *
 * The route already says which kind is meant (`/groups` vs `/users`), so the
 * canonical field is just `id`. But `groupId`/`userId` is what an API caller
 * naturally reaches for, so accept those too and normalize — rejecting them
 * would be pedantry, not validation.
 */
export const assignmentSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    groupId: z.string().trim().min(1).optional(),
    userId: z.string().trim().min(1).optional(),
  })
  .transform((v, ctx) => {
    const id = v.id ?? v.groupId ?? v.userId
    if (!id) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: "An Okta id is required (send id, groupId or userId)",
      })
      return z.NEVER
    }
    return { id }
  })

/**
 * A connector is created either from raw OIDC credentials or, more usefully,
 * by pointing at an Okta app this service manages — in which case the client
 * id/secret and issuer are read straight from Okta.
 */
export const createConnectorSchema = z
  .object({
    name: z.string().trim().min(1, "A connector name is required").max(100),
    service: z.string().trim().min(1).max(64).optional(),
    uid: z.string().trim().min(1).max(128).optional(),
    oktaAppId: z.string().trim().min(1).optional(),
    issuer: httpsUrl.optional(),
    clientId: z.string().trim().min(1).optional(),
    clientSecret: z.string().trim().min(1).optional(),
    scopes: z.array(z.string().trim().min(1)).optional(),
    forwardedClaims: z.array(z.string().trim().min(1)).optional(),
    tokenEndpointAuthMethod: z.string().trim().min(1).optional(),
  })
  .refine((v) => Boolean(v.oktaAppId) || Boolean(v.issuer && v.clientId && v.clientSecret), {
    message: "Provide either oktaAppId, or issuer + clientId + clientSecret",
  })

export const updateConnectorSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  clientId: z.string().trim().min(1).optional(),
  clientSecret: z.string().trim().min(1).optional(),
  scopes: z.array(z.string().trim().min(1)).optional(),
  forwardedClaims: z.array(z.string().trim().min(1)).optional(),
})

export const passportSchema = z.object({
  connectorId: z.string().trim().min(1, "A connector id is required"),
  deploymentType: z.enum(DEPLOYMENT_TYPES).default("all"),
})

export type CreateAppBody = z.infer<typeof createAppSchema>
export type UpdateAppBody = z.infer<typeof updateAppSchema>
export type CreateConnectorBody = z.infer<typeof createConnectorSchema>
export type UpdateConnectorBody = z.infer<typeof updateConnectorSchema>
export type PassportBody = z.infer<typeof passportSchema>
