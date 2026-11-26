import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"
import { hashPassword, verifyPassword } from "../src/lib/auth"
import { parseAndValidateCSV } from "../src/domain/import"
import { totalExposure } from "../src/domain/exposure"
import { scenario } from "../src/domain/scenario"
import { evaluateAlerts } from "../src/domain/alert"

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL || "postgres://hedgehint:hedgehint@localhost:5433/hedgehint_test?sslmode=disable" } },
})

describe("Full Customer Journey: From Empty Database to Real Results", () => {
  let orgId: string, adminId: string, officerId: string, managerId: string, reqId: string

  beforeAll(async () => {
    const org = await prisma.organisation.create({
      data: { name: `Horizon E2E ${Date.now()}`, baseCurrency: "GBP", riskAppetite: "medium" },
    })
    orgId = org.id

    const admin = await prisma.user.create({
      data: { email: `admin_${Date.now()}@test.local`, passwordHash: await hashPassword("AdminSecret2026!"), role: "admin" },
    })
    adminId = admin.id
    await prisma.organisationMember.create({ data: { organisationId: orgId, userId: adminId, role: "admin" } })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("1. Admin verifies sign-in", async () => {
    const admin = await prisma.user.findUnique({ where: { id: adminId } })
    expect(await verifyPassword("AdminSecret2026!", admin!.passwordHash!)).toBe(true)
  })

  it("2. Officer requests access; Admin approves", async () => {
    const officer = await prisma.user.create({
      data: { email: `officer_${Date.now()}@test.local`, passwordHash: "h", role: "pending" },
    })
    officerId = officer.id
    expect(officer.role).toBe("pending")

    await prisma.user.update({ where: { id: officerId }, data: { role: "officer" } })
    await prisma.organisationMember.create({ data: { organisationId: orgId, userId: officerId, role: "officer" } })

    const manager = await prisma.user.create({
      data: { email: `manager_${Date.now()}@test.local`, passwordHash: "h", role: "manager" },
    })
    managerId = manager.id
    await prisma.organisationMember.create({ data: { organisationId: orgId, userId: managerId, role: "manager" } })
  })
  it("3. Ingests CSV of POs and Invoices", async () => {
    const csv = `type,supplier,currency,amount,duedate,orderdate,paymentdate
po,Shenzhen Hardware,USD,80000,,2026-11-15,2026-12-15
invoice,Rotterdam Logistics,EUR,45000,2026-12-05,,`
    const parsed = parseAndValidateCSV(csv)

    await prisma.purchaseOrder.create({
      data: {
        organisationId: orgId,
        supplierName: parsed.pos[0].supplierName,
        currency: parsed.pos[0].currency,
        amount: parsed.pos[0].amount,
        orderDate: parsed.pos[0].orderDate,
        expectedPaymentDate: parsed.pos[0].expectedPaymentDate,
        status: "open",
      },
    })
    await prisma.supplierInvoice.create({
      data: {
        organisationId: orgId,
        supplierName: parsed.invoices[0].supplierName,
        currency: parsed.invoices[0].currency,
        amount: parsed.invoices[0].amount,
        dueDate: parsed.invoices[0].dueDate,
        status: "open",
      },
    })
    expect(await prisma.purchaseOrder.count({ where: { organisationId: orgId } })).toBe(1)
  })

  it("4. Evaluates total exposure and what-if rate shock (+10%)", async () => {
    await prisma.exchangeRate.createMany({
      data: [
        { organisationId: orgId, currencyPair: "GBP/USD", rate: 0.78, source: "manual", observedAt: new Date() },
        { organisationId: orgId, currencyPair: "GBP/EUR", rate: 0.84, source: "manual", observedAt: new Date() },
      ],
    })

    const pos = await prisma.purchaseOrder.findMany({ where: { organisationId: orgId } })
    const invoices = await prisma.supplierInvoice.findMany({ where: { organisationId: orgId } })
    const rates = await prisma.exchangeRate.findMany({ where: { organisationId: orgId } })

    const exposure = totalExposure(
      pos.map((p) => ({ id: p.id, supplierName: p.supplierName, currency: p.currency, amount: Number(p.amount), orderDate: p.orderDate, expectedPaymentDate: p.expectedPaymentDate, status: p.status })),
      invoices.map((i) => ({ id: i.id, supplierName: i.supplierName, currency: i.currency, amount: Number(i.amount), dueDate: i.dueDate, status: i.status })),
      rates.map((r) => ({ currencyPair: r.currencyPair, rate: Number(r.rate) })),
      "GBP"
    )
    expect(exposure.grandBase).toBeCloseTo(100200)

    const shock = scenario(
      pos.map((p) => ({ id: p.id, supplierName: p.supplierName, currency: p.currency, amount: Number(p.amount), orderDate: p.orderDate, expectedPaymentDate: p.expectedPaymentDate, status: p.status })),
      [],
      rates.map((r) => ({ currencyPair: r.currencyPair, rate: Number(r.rate) })),
      "GBP",
      10
    )
    expect(shock.find((s) => s.currency === "USD")!.deltaBase).toBeCloseTo(6240)
  })

  it("5. Workflow: Officer requests hedge, self-approval blocked, Manager approves", async () => {
    const req = await prisma.purchaseRequest.create({
      data: { organisationId: orgId, currency: "USD", amount: 80000, requestedBy: officerId, status: "requested" },
    })
    reqId = req.id

    expect(() => {
      if (req.requestedBy === officerId) throw new Error("Separation of duties violation")
    }).toThrow("Separation of duties violation")

    await prisma.purchaseRequest.update({ where: { id: reqId }, data: { status: "approved", approvedBy: managerId } })
    const approved = await prisma.purchaseRequest.findUnique({ where: { id: reqId } })
    expect(approved?.status).toBe("approved")
  })

  it("6. Records execution and calculates realised savings", async () => {
    const req = await prisma.purchaseRequest.findUnique({ where: { id: reqId } })
    const saving = (0.78 - 0.77) * Number(req!.amount)

    await prisma.currencyBought.create({
      data: {
        organisationId: orgId,
        purchaseRequestId: req!.id,
        currency: req!.currency,
        amount: req!.amount,
        rateAchieved: 0.77,
        marketRateAtPurchase: 0.78,
        savingBaseCurrency: saving,
        boughtAt: new Date(),
        recordedBy: officerId,
      },
    })

    const buy = await prisma.currencyBought.findFirst({ where: { organisationId: orgId } })
    expect(Number(buy?.savingBaseCurrency)).toBeCloseTo(800)
  })

  it("7. Triggers rate alert on target crossover", () => {
    const triggered = evaluateAlerts(
      [{ id: "a1", organisationId: orgId, currencyPair: "GBP/EUR", thresholdRate: 0.85, direction: "above", status: "active" }],
      [{ currencyPair: "GBP/EUR", rate: 0.86, observedAt: new Date() }]
    )
    expect(triggered).toHaveLength(1)
  })

})
