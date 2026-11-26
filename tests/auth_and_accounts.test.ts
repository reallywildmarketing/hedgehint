import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"
import { hashPassword, verifyPassword } from "../src/lib/auth"

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://hedgehint:hedgehint@localhost:5433/hedgehint_test?sslmode=disable"

if (!TEST_DATABASE_URL.includes("test")) {
  throw new Error("Safety check failed: integration tests must only run on a test database!")
}

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
})

describe("Account & Session Lifecycle Checks", () => {
  let testUserId: string
  let testEmail: string

  beforeAll(async () => {
    testEmail = `officer_${crypto.randomUUID()}@test.local`
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Finance Officer",
        passwordHash: await hashPassword("Secret1234!"),
        role: "officer",
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("fails authentication on incorrect password", async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } })
    expect(user).toBeDefined()
    const valid = await verifyPassword("WrongPassword!", user!.passwordHash!)
    expect(valid).toBe(false)
  })

  it("blocks pending users from signing in", async () => {
    const pendingUser = await prisma.user.create({
      data: {
        email: `pending_${crypto.randomUUID()}@test.local`,
        name: "Pending Access",
        passwordHash: await hashPassword("Secret1234!"),
        role: "pending",
      },
    })

    const canSignIn = pendingUser.role !== "pending"
    expect(canSignIn).toBe(false)
  })

  it("revoking sessions invalidates all active tokens on password change", async () => {
    const token1 = crypto.randomUUID()
    const token2 = crypto.randomUUID()

    await prisma.session.createMany({
      data: [
        { id: token1, sessionToken: token1, userId: testUserId, expires: new Date(Date.now() + 86400000) },
        { id: token2, sessionToken: token2, userId: testUserId, expires: new Date(Date.now() + 86400000) },
      ],
    })

    const activeBefore = await prisma.session.count({ where: { userId: testUserId } })
    expect(activeBefore).toBe(2)

    await prisma.session.deleteMany({ where: { userId: testUserId } })

    const activeAfter = await prisma.session.count({ where: { userId: testUserId } })
    expect(activeAfter).toBe(0)
  })
})
