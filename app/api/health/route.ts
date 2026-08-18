import { NextResponse } from "next/server"

import { configStatus, missingRequired } from "@/lib/env"

export const dynamic = "force-dynamic"

/** Unauthenticated liveness + configuration probe. Never returns secrets. */
export async function GET() {
  const missing = missingRequired()
  return NextResponse.json(
    {
      status: missing.length === 0 ? "ok" : "not_configured",
      missing,
      config: configStatus().map(({ key, present, required }) => ({ key, present, required })),
    },
    { status: missing.length === 0 ? 200 : 503 },
  )
}
