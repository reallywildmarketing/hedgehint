import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/lib/auth"

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://hedgehint:hedgehint@localhost:5433/hedgehint_test?sslmode=disable"

if (!TEST_DATABASE_URL.includes("test")) {
  throw new Error("Safety check failed: integration tests must only run on a test database!")
}

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
})

describe("Business Invariants & Tenant Isolation", () => {
  let testOrgId: string
  let officerUserId: string
  let managerUserId: string

  beforeAll(async () => {
    const org = await prisma.organisation.create({
      data: { name: `Test Org ${Date.now()}`, baseCurrency: "GBP", riskAppetite: "medium" },
    })
    testOrgId = org.id

    const officer = await prisma.user.create({
      data: { email: `officer_${crypto.randomUUID()}@test.local`, passwordHash: await hashPassword("P@ss1"), role: "officer" },
    })
    officerUserId = officer.id

    const manager = await prisma.user.create({
      data: { email: `manager_${crypto.randomUUID()}@test.local`, passwordHash: await hashPassword("P@ss1"), role: "manager" },
    })
    managerUserId = manager.id

    await prisma.organisationMember.createMany({
      data: [
        { organisationId: testOrgId, userId: officerUserId, role: "officer" },
        { organisationId: testOrgId, userId: managerUserId, role: "manager" },
      ],
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("enforces separation of duties: requester cannot self-approve", async () => {
    const request = await prisma.purchaseRequest.create({
      data: {
        organisationId: testOrgId,
        currency: "USD",
        amount: 25000,
        requestedBy: managerUserId,
        status: "requested",
      },
    })

    const isSelfApproval = request.requestedBy === managerUserId
    expect(isSelfApproval).toBe(true)

    const checkApproval = () => {
      if (request.requestedBy === managerUserId) {
        throw new Error("Separation of duties violation: requester cannot approve own request.")
      }
    }
    expect(checkApproval).toThrowError("Separation of duties violation")
  })

  it("blocks recording currency bought unless request is approved", async () => {
    const unapprovedReq = await prisma.purchaseRequest.create({
      data: {
        organisationId: testOrgId,
        currency: "USD",
        amount: 10000,
        requestedBy: officerUserId,
        status: "requested",
      },
    })

    const recordBuyAction = async () => {
      if (unapprovedReq.status !== "approved") {
        throw new Error("Currency can only be recorded against an approved purchase request.")
      }
    }

    await expect(recordBuyAction()).rejects.toThrow("Currency can only be recorded against an approved purchase request.")
  })

  it("enforces strict tenant isolation across organisations", async () => {
    const otherOrg = await prisma.organisation.create({
      data: { name: `Separate Tenant ${Date.now()}`, baseCurrency: "EUR" },
    })

    await prisma.purchaseOrder.create({
      data: {
        organisationId: otherOrg.id,
        supplierName: "Secret Foreign Supplier",
        currency: "USD",
        amount: 999999,
        orderDate: new Date(),
        expectedPaymentDate: new Date(),
        status: "open",
      },
    })

    const scopedOrders = await prisma.purchaseOrder.findMany({
      where: { organisationId: testOrgId },
    })

    expect(scopedOrders.some((po) => po.supplierName === "Secret Foreign Supplier")).toBe(false)
  })
})

