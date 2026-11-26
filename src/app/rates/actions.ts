"use server"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addManualRate(formData: FormData) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) {
    throw new Error("Unauthorized")
  }

  const currencyPair = String(formData.get("currencyPair") || "").toUpperCase()
  const rateNum = Number(formData.get("rate"))

  if (!/^[A-Z]{3}\/[A-Z]{3}$/.test(currencyPair)) {
    throw new Error("Invalid currency pair format (e.g. GBP/USD)")
  }
  if (isNaN(rateNum) || rateNum <= 0) {
    throw new Error("Rate must be a positive number")
  }

  await prisma.exchangeRate.create({
    data: {
      organisationId: auth.organisation.id,
      currencyPair,
      rate: rateNum,
      source: "manual",
      observedAt: new Date(),
    },
  })

  // Write audit event
  await prisma.auditEvent.create({
    data: {
      organisationId: auth.organisation.id,
      userId: auth.user.id,
      action: "CREATE_RATE_MANUAL",
      entityType: "exchange_rate",
      details: { currencyPair, rate: rateNum },
    },
  })

  revalidatePath("/rates")
  revalidatePath("/dashboard")
  revalidatePath("/exposure")
}
