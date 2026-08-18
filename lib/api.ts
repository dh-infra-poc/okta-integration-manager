import "server-only"

import { NextResponse } from "next/server"
import type { ZodType } from "zod"

import { requireApiKey } from "@/lib/auth"
import { badRequest, toErrorPayload } from "@/lib/errors"

/**
 * Wraps a route handler so every endpoint gets the same key check, the same
 * JSON error envelope, and no caching.
 */
export function handler<Ctx>(fn: (request: Request, context: Ctx) => Promise<unknown>) {
  return async (request: Request, context: Ctx) => {
    try {
      requireApiKey(request)
      const data = await fn(request, context)
      if (data === undefined) return new NextResponse(null, { status: 204 })
      return NextResponse.json(data)
    } catch (error) {
      const { status, body } = toErrorPayload(error)
      return NextResponse.json(body, { status })
    }
  }
}

/** Parses and validates a JSON body, turning zod issues into a 400. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw badRequest("Request body must be valid JSON")
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    throw badRequest(
      "Request body failed validation",
      result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    )
  }
  return result.data
}
