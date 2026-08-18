/** A normalized failure that both the API layer and the UI can render. */
export class ServiceError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = "ServiceError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ServiceError(400, "bad_request", message, details)

export const unauthorized = (message = "Missing or invalid API key") =>
  new ServiceError(401, "unauthorized", message)

export const notConfigured = (missing: string[]) =>
  new ServiceError(
    503,
    "not_configured",
    `The service is missing required configuration: ${missing.join(", ")}`,
    { missing },
  )

export function toErrorPayload(error: unknown) {
  if (error instanceof ServiceError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message, details: error.details } },
    }
  }
  const message = error instanceof Error ? error.message : "Unexpected error"
  return { status: 500, body: { error: { code: "internal_error", message } } }
}

/** Turns any thrown value into a short string suitable for UI display. */
export function errorMessage(error: unknown): string {
  if (error instanceof ServiceError) return error.message
  if (error instanceof Error) return error.message
  return "Unexpected error"
}
