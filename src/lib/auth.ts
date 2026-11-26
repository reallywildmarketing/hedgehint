import { compare, hash } from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "./prisma"

const SESSION_COOKIE = "hedgehint_session"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function hashPassword(password: string) {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return compare(password, hash)
}

/** Create a session for a user, revoking all existing sessions (used on password change). */
export async function createSession(userId: string) {
  // Revoke all existing sessions for this user (password change / new login invalidates old).
  await prisma.session.deleteMany({ where: { userId } })
  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + SESSION_TTL_MS)
  const session = await prisma.session.create({
    data: { id: token, sessionToken: token, userId, expires },
  })
  return session
}

/** Get the current session + user + organisation from the request cookies. */
export async function getAuthSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { id: token },
    include: {
      user: {
        include: {
          members: { include: { organisation: true } },
        },
      },
    },
  })

  if (!session) return null
  if (session.expires < new Date()) {
    await prisma.session.delete({ where: { id: token } })
    return null
  }
  const user = session.user
  if (!user) return null

  // Primary organisation: the user's first membership (admin picks default later).
  const membership = user.members[0]
  const organisation = membership?.organisation ?? null

  return { session, user, organisation, membership }
}

/** Revoke every session for a user (password change, logout). */
export async function revokeAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
}

/** Sign out: revoke the current session and clear the cookie. */
export async function signOut() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } })
  }
  clearSessionCookie()
}

export { SESSION_COOKIE }
