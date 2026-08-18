/**
 * Passport constants shared by server and client code.
 *
 * These live outside `lib/vercel.ts` deliberately — that module is
 * `server-only`, and importing it from a Client Component would pull the
 * Vercel API token path into the browser bundle.
 */

export const DEPLOYMENT_TYPES = ["all", "preview", "prod_deployment_urls_and_all_previews"] as const

export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number]

export const DEPLOYMENT_LABELS: Record<DeploymentType, string> = {
  all: "All deployments",
  preview: "Preview only",
  prod_deployment_urls_and_all_previews: "Production URLs and previews",
}

/** The Passport block stored on a Vercel project. */
export type PassportConfig = {
  connectorId: string
  deploymentType: string
  publicPathRules?: unknown
} | null

/** The minimum a Client Component needs to render a project picker. */
export type ProjectSummary = {
  id: string
  name: string
  passport: PassportConfig
}
