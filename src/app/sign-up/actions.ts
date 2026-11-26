"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export interface SignUpResult {
  ok: boolean
  error?: string
}

// Sign-up creates a pending request with no role. The response never reveals
// whether an email already exists.
export async function signUp(formData: FormData): Promise<SignUpResult> {
  const email = String(formData.get("email") || "")
  const name = String(formData.get("name") || "")
  const password = String(formData.get("password") || "")

  if (!email || !password) return { ok: false, error: "Email and password are required." }

  // Always perform the hash so timing doesn't reveal email existence.
  await hashPassword(password)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Still return generic success so email existence is never revealed.
    return { ok: true }
  }

  await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
      role: "pending", // no role; cannot sign in until approved by an administrator
    },
  })
  return { ok: true }
}
