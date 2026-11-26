"use server"

import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth"

export interface SignInResult {
  ok: boolean
  mustChangePassword?: boolean
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  // Look up the user generically; never reveal whether the email exists.
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    // Constant-ish work to mitigate timing enumeration.
    await verifyPassword("", "$2b$12$unusedunusedunusedunusedunusedunusedxe")
    return { ok: false }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return { ok: false }

  // Pending users cannot sign in.
  if (user.role === "pending") return { ok: false }

  const session = await createSession(user.id)
  await setSessionCookie(session.sessionToken)
  return { ok: true, mustChangePassword: user.mustChangePassword }
}
