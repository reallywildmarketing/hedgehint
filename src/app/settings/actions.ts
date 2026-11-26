"use server"

import { getAuthSession, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateOrgSettings(formData: FormData) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation || auth.user.role !== "admin") {
    throw new Error("Only an administrator may update organisation settings.")
  }

  const name = String(formData.get("name") || "")
  const baseCurrency = String(formData.get("baseCurrency") || "GBP").toUpperCase()
  const riskAppetite = String(formData.get("riskAppetite") || "medium")

  await prisma.organisation.update({
    where: { id: auth.organisation.id },
    data: { name, baseCurrency, riskAppetite },
  })

  await prisma.auditEvent.create({
    data: {
      organisationId: auth.organisation.id,
      userId: auth.user.id,
      action: "UPDATE_ORG_SETTINGS",
      entityType: "organisation",
      entityId: auth.organisation.id,
      details: { name, baseCurrency, riskAppetite },
    },
  })

  revalidatePath("/settings")
  revalidatePath("/dashboard")
}

export async function approveUserAction(userId: string, role: string) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation || auth.user.role !== "admin") {
    throw new Error("Only an administrator may approve members.")
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { role },
    }),
    prisma.organisationMember.upsert({
      where: {
        organisationId_userId: {
          organisationId: auth.organisation.id,
          userId,
        },
      },
      update: { role },
      create: {
        organisationId: auth.organisation.id,
        userId,
        role,
        invitedBy: auth.user.id,
      },
    }),
    prisma.auditEvent.create({
      data: {
        organisationId: auth.organisation.id,
        userId: auth.user.id,
        action: "APPROVE_USER",
        entityType: "user",
        entityId: userId,
        details: { assignedRole: role },
      },
    }),
  ])

  revalidatePath("/settings")
}

export async function setTemporaryPasswordAction(userId: string, tempPass: string) {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation || auth.user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(tempPass),
      mustChangePassword: true,
    },
  })

  // Invalidate all existing sessions
  await prisma.session.deleteMany({ where: { userId } })

  await prisma.auditEvent.create({
    data: {
      organisationId: auth.organisation.id,
      userId: auth.user.id,
      action: "SET_TEMPORARY_PASSWORD",
      entityType: "user",
      entityId: userId,
    },
  })

  revalidatePath("/settings")
}
