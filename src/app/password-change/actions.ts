"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { getAuthSession, revokeAllSessionsForUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export interface PwdChangeResult {
  ok: boolean
  error?: string
}

export async function changePassword(formData: FormData): Promise<PwdChangeResult> {
  const auth = await getAuthSession()
  if (!auth?.user) return { ok: false, error: "Not signed in." }

  const password = String(formData.get("password") || "")
  if (!password || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." }
  }

  // Set new password, hash it, and revoke all existing sessions.
  await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
    },
  })
  await revokeAllSessionsForUser(auth.user.id)

  redirect("/dashboard")
}

export async function setTemporaryPassword(
  userId: string,
  temporaryPassword: string
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
    },
  })
  await revokeAllSessionsForUser(userId)
}
