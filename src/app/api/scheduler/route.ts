import { NextResponse, type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { evaluateAlerts } from "@/domain/alert"

export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get("x-scheduler-secret")
  const expectedSecret = process.env.SCHEDULER_SECRET || "dev-scheduler-secret"

  if (!secretHeader || secretHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // 1. Mark past-due invoices as "overdue"
  const overdueUpdate = await prisma.supplierInvoice.updateMany({
    where: {
      status: "open",
      dueDate: { lt: now },
    },
    data: { status: "overdue" },
  })

  // 2. Evaluate rate alerts across all active organisations
  const activeAlerts = await prisma.rateAlert.findMany({
    where: { status: "active" },
  })

  const latestRates = await prisma.exchangeRate.findMany({
    orderBy: { observedAt: "desc" },
    distinct: ["currencyPair"],
  })

  const domainAlerts = activeAlerts.map((a) => ({
    id: a.id,
    organisationId: a.organisationId,
    currencyPair: a.currencyPair,
    thresholdRate: Number(a.thresholdRate),
    direction: a.direction as "above" | "below",
    status: a.status as "active",
  }))

  const domainRates = latestRates.map((r) => ({
    currencyPair: r.currencyPair,
    rate: Number(r.rate),
    observedAt: r.observedAt,
  }))

  const triggered = evaluateAlerts(domainAlerts, domainRates)

  // Update triggered alerts
  for (const t of triggered) {
    await prisma.rateAlert.update({
      where: { id: t.alertId },
      data: { status: "triggered", triggeredAt: now },
    })
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    invoicesMarkedOverdue: overdueUpdate.count,
    alertsEvaluated: activeAlerts.length,
    alertsTriggered: triggered.length,
  })
}
