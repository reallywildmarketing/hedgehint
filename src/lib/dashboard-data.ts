import { prisma } from "@/lib/prisma"
import { totalExposure } from "@/domain/exposure"
import { recommend } from "@/domain/recommendation"

export async function getDashboardData(orgId: string, baseCurrency: string, riskAppetite: string) {
  const [pos, invoices, rates, alerts, requests, overdueInvoices] = await Promise.all([
    prisma.purchaseOrder.findMany({ where: { organisationId: orgId, status: "open" } }),
    prisma.supplierInvoice.findMany({ where: { organisationId: orgId, status: { in: ["open", "overdue"] } } }),
    prisma.exchangeRate.findMany({ where: { organisationId: orgId }, orderBy: { observedAt: "desc" } }),
    prisma.rateAlert.findMany({ where: { organisationId: orgId, status: "triggered" } }),
    prisma.purchaseRequest.findMany({ where: { organisationId: orgId, status: "requested" } }),
    prisma.supplierInvoice.findMany({
      where: { organisationId: orgId, status: { in: ["open", "overdue"] }, dueDate: { lte: new Date() } },
    }),
  ])

  const cleanPos = pos.map((p) => ({
    id: p.id,
    supplierName: p.supplierName,
    currency: p.currency,
    amount: Number(p.amount),
    orderDate: p.orderDate,
    expectedPaymentDate: p.expectedPaymentDate,
    status: p.status,
  }))

  const cleanInvoices = invoices.map((i) => ({
    id: i.id,
    supplierName: i.supplierName,
    currency: i.currency,
    amount: Number(i.amount),
    dueDate: i.dueDate,
    status: i.status,
  }))

  const cleanRates = rates.map((r) => ({ currencyPair: r.currencyPair, rate: Number(r.rate) }))
  const exposure = totalExposure(cleanPos, cleanInvoices, cleanRates, baseCurrency)
  const isStaleRates = rates.length === 0 || rates[0].recordedAt < new Date(Date.now() - 3600000)

  const recommendations = exposure.byCurrency.slice(0, 3).map((c) => {
    const pair = `${baseCurrency}/${c.currency}`
    const r = cleanRates.find((x) => x.currencyPair === pair)?.rate ?? 1
    return recommend({
      currency: c.currency,
      totalForeign: c.totalForeign,
      currentRate: r,
      historicalAverageRate: r * 1.02,
      riskAppetite: (riskAppetite as "low" | "medium" | "high") || "medium",
    })
  })

  return {
    cleanPos,
    cleanInvoices,
    exposure,
    isStaleRates,
    recommendations,
    alertsCount: alerts.length,
    requestsCount: requests.length,
    overdueCount: overdueInvoices.length,
  }
}
