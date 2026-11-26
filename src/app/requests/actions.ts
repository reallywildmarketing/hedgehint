"use server"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createPurchaseRequest(formData: FormData) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) throw new Error("Unauthorized")

  const currency = String(formData.get("currency") || "").toUpperCase()
  const amount = Number(formData.get("amount"))
  const targetRate = formData.get("targetRate") ? Number(formData.get("targetRate")) : null
  const rationale = String(formData.get("rationale") || "")

  if (!/^[A-Z]{3}$/.test(currency) || isNaN(amount) || amount <= 0) {
    throw new Error("Valid currency and positive amount required")
  }

  await prisma.purchaseRequest.create({
    data: {
      organisationId: auth.organisation.id,
      currency,
      amount,
      targetRate,
      rationale,
      requestedBy: auth.user.id,
      status: "requested",
    },
  })

  await prisma.auditEvent.create({
    data: {
      organisationId: auth.organisation.id,
      userId: auth.user.id,
      action: "CREATE_PURCHASE_REQUEST",
      entityType: "purchase_request",
      details: { currency, amount },
    },
  })

  revalidatePath("/requests")
  revalidatePath("/dashboard")
}

export async function decidePurchaseRequest(requestId: string, decision: "approve" | "reject", reason?: string) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) throw new Error("Unauthorized")

  const req = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
  })

  if (!req || req.organisationId !== auth.organisation.id) {
    throw new Error("Request not found")
  }

  // Separation of duties invariant: requester CANNOT approve their own request!
  if (decision === "approve" && req.requestedBy === auth.user.id) {
    throw new Error("Separation of duties violation: You cannot approve your own purchase request.")
  }

  // User must have manager or admin role to approve/reject
  const role = auth.membership?.role || auth.user.role
  if (role !== "admin" && role !== "manager") {
    throw new Error("Permission denied: Only a Finance Manager or Admin may approve purchase requests.")
  }

  await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: {
      status: decision === "approve" ? "approved" : "rejected",
      approvedBy: auth.user.id,
      approvedAt: new Date(),
      rejectionReason: decision === "reject" ? reason || "Rejected by manager" : null,
    },
  })

  await prisma.auditEvent.create({
    data: {
      organisationId: auth.organisation.id,
      userId: auth.user.id,
      action: decision === "approve" ? "APPROVE_PURCHASE_REQUEST" : "REJECT_PURCHASE_REQUEST",
      entityType: "purchase_request",
      entityId: requestId,
      details: { decision, approver: auth.user.id },
    },
  })

  revalidatePath("/requests")
  revalidatePath("/dashboard")
}

export async function recordCurrencyBought(formData: FormData) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) throw new Error("Unauthorized")

  const requestId = String(formData.get("requestId") || "")
  const rateAchieved = Number(formData.get("rateAchieved"))
  const marketRate = Number(formData.get("marketRate"))

  const req = await prisma.purchaseRequest.findUnique({ where: { id: requestId } })
  if (!req || req.status !== "approved") {
    throw new Error("Currency can only be recorded against an approved purchase request.")
  }

  const amount = Number(req.amount)
  // Saving: (marketRate - rateAchieved) * amount
  const savingBaseCurrency = (marketRate - rateAchieved) * amount

  await prisma.$transaction([
    prisma.currencyBought.create({
      data: {
        organisationId: auth.organisation.id,
        purchaseRequestId: req.id,
        currency: req.currency,
        amount: req.amount,
        rateAchieved,
        marketRateAtPurchase: marketRate,
        savingBaseCurrency,
        boughtAt: new Date(),
        recordedBy: auth.user.id,
      },
    }),
    prisma.purchaseRequest.update({
      where: { id: req.id },
      data: { status: "executed" },
    }),
    prisma.auditEvent.create({
      data: {
        organisationId: auth.organisation.id,
        userId: auth.user.id,
        action: "RECORD_CURRENCY_BOUGHT",
        entityType: "currency_bought",
        details: { amount, rateAchieved, savingBaseCurrency },
      },
    }),
  ])

  revalidatePath("/requests")
  revalidatePath("/dashboard")
  revalidatePath("/reports")
}
