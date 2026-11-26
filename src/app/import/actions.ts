"use server"

import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseAndValidateCSV } from "@/domain/import"
import { revalidatePath } from "next/cache"

export interface ImportResponse {
  success: boolean
  totalRows: number
  importedPos: number
  importedInvoices: number
  errors: { rowNumber: number; field: string; message: string }[]
}

export async function uploadCSVAction(formData: FormData): Promise<ImportResponse> {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) throw new Error("Unauthorized")

  const orgId = auth.organisation.id
  const file = formData.get("file") as File | null
  const rawText = formData.get("csvText") as string | null

  let content = ""
  let fileName = "pasted_input.csv"

  if (file && typeof file.text === "function") {
    content = await file.text()
    fileName = file.name
  } else if (rawText) {
    content = rawText
  }

  if (!content.trim()) {
    return {
      success: false,
      totalRows: 0,
      importedPos: 0,
      importedInvoices: 0,
      errors: [{ rowNumber: 0, field: "file", message: "CSV content cannot be empty." }],
    }
  }

  const parsed = parseAndValidateCSV(content)

  if (parsed.errors.length > 0 && parsed.pos.length === 0 && parsed.invoices.length === 0) {
    return {
      success: false,
      totalRows: parsed.totalRows,
      importedPos: 0,
      importedInvoices: 0,
      errors: parsed.errors,
    }
  }

  // Atomic database ingestion with ImportJob tracking
  await prisma.$transaction(async (tx) => {
    const job = await tx.importJob.create({
      data: {
        organisationId: orgId,
        fileName,
        status: parsed.errors.length > 0 ? "completed_with_errors" : "completed",
        rowsTotal: parsed.totalRows,
        rowsOk: parsed.pos.length + parsed.invoices.length,
        rowsError: parsed.errors.length,
        createdBy: auth.user.id,
      },
    })

    if (parsed.errors.length > 0) {
      await tx.importError.createMany({
        data: parsed.errors.map((e) => ({
          importJobId: job.id,
          rowNumber: e.rowNumber,
          field: e.field,
          message: e.message,
        })),
      })
    }

    if (parsed.pos.length > 0) {
      await tx.purchaseOrder.createMany({
        data: parsed.pos.map((p) => ({
          organisationId: orgId,
          supplierName: p.supplierName,
          supplierRef: p.supplierRef,
          currency: p.currency,
          amount: p.amount,
          orderDate: p.orderDate,
          expectedPaymentDate: p.expectedPaymentDate,
          status: "open",
        })),
      })
    }

    if (parsed.invoices.length > 0) {
      await tx.supplierInvoice.createMany({
        data: parsed.invoices.map((inv) => ({
          organisationId: orgId,
          supplierName: inv.supplierName,
          invoiceRef: inv.invoiceRef,
          currency: inv.currency,
          amount: inv.amount,
          dueDate: inv.dueDate,
          status: "open",
        })),
      })
    }

    await tx.auditEvent.create({
      data: {
        organisationId: orgId,
        userId: auth.user.id,
        action: "IMPORT_CSV",
        entityType: "import_job",
        entityId: job.id,
        details: { fileName, importedPos: parsed.pos.length, importedInvoices: parsed.invoices.length },
      },
    })
  })

  revalidatePath("/dashboard")
  revalidatePath("/exposure")
  revalidatePath("/import")

  return {
    success: true,
    totalRows: parsed.totalRows,
    importedPos: parsed.pos.length,
    importedInvoices: parsed.invoices.length,
    errors: parsed.errors,
  }
}
