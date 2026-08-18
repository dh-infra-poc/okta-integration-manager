"use server"

import { errorMessage } from "@/lib/errors"
import { searchGroups, searchUsers } from "@/lib/okta"

export type DirectoryEntry = { id: string; name: string; secondary?: string }

/** Directory lookup for the assignment pickers. Returns ids and labels only. */
export async function searchDirectory(
  kind: "group" | "user",
  query: string,
): Promise<{ entries?: DirectoryEntry[]; error?: string }> {
  try {
    const trimmed = query.trim()
    if (kind === "group") {
      const groups = await searchGroups(trimmed || undefined, 15)
      return { entries: groups.map((g) => ({ id: g.id, name: g.name, secondary: g.description || g.type })) }
    }
    const users = await searchUsers(trimmed || undefined, 15)
    return { entries: users.map((u) => ({ id: u.id, name: u.name, secondary: u.login })) }
  } catch (error) {
    return { error: errorMessage(error) }
  }
}
