"use server"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createRateAlert(formData: FormData) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) throw new Error("Unauthorized")

  const currencyPair = String(formData.get("currencyPair") || "").toUpperCase()
  const thresholdRate = Number(formData.get("thresholdRate"))
  const direction = String(formData.get("direction") || "below") as "above" | "below"

  if (!/^[A-Z]{3}\/[A-Z]{3}$/.test(currencyPair) || isNaN(thresholdRate) || thresholdRate <= 0) {
    throw new Error("Valid currency pair and positive threshold required")
  }

  await prisma.rateAlert.create({
    data: {
      organisationId: auth.organisation.id,
      currencyPair,
      thresholdRate,
      direction,
      createdBy: auth.user.id,
      status: "active",
    },
  })

  await prisma.auditEvent.create({
    data: {
      organisationId: auth.organisation.id,
      userId: auth.user.id,
      action: "CREATE_RATE_ALERT",
      entityType: "rate_alert",
      details: { currencyPair, thresholdRate, direction },
    },
  })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}

export async function dismissRateAlert(alertId: string) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) throw new Error("Unauthorized")

  await prisma.rateAlert.update({
    where: { id: alertId },
    data: {
      status: "dismissed",
      acknowledgedBy: auth.user.id,
      acknowledgedAt: new Date(),
    },
  })

  revalidatePath("/alerts")
  revalidatePath("/dashboard")
}
