/**
 * Pure CSV parser and validator for Purchase Orders and Invoices.
 */

export interface ParsedPORow {
  type: "po"
  rowNumber: number
  supplierName: string
  supplierRef?: string
  currency: string
  amount: number
  orderDate: Date
  expectedPaymentDate: Date
}

export interface ParsedInvoiceRow {
  type: "invoice"
  rowNumber: number
  supplierName: string
  invoiceRef?: string
  currency: string
  amount: number
  dueDate: Date
}

export interface ImportErrorDetail {
  rowNumber: number
  field: string
  message: string
}

export interface ParseResult {
  pos: ParsedPORow[]
  invoices: ParsedInvoiceRow[]
  errors: ImportErrorDetail[]
  totalRows: number
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseAndValidateCSV(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const pos: ParsedPORow[] = []
  const invoices: ParsedInvoiceRow[] = []
  const errors: ImportErrorDetail[] = []

  if (lines.length <= 1) {
    return { pos, invoices, errors, totalRows: 0 }
  }

  const rawHeaders = parseCSVLine(lines[0])
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""))

  const totalRows = lines.length - 1

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1
    const cols = parseCSVLine(lines[i])

    const get = (key: string): string => {
      const idx = headers.indexOf(key.toLowerCase().replace(/[\s_-]+/g, ""))
      return idx >= 0 && idx < cols.length ? cols[idx] : ""
    }

    const type = (get("type") || "po").toLowerCase()
    const supplierName = get("supplier") || get("suppliername") || get("vendor")
    const currency = (get("currency") || "").toUpperCase()
    const amountStr = get("amount") || get("total")
    const amount = Number(amountStr)

    if (!supplierName) {
      errors.push({ rowNumber, field: "supplier", message: "Supplier name is required." })
      continue
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.push({ rowNumber, field: "currency", message: "Valid 3-letter currency code required." })
      continue
    }

    if (isNaN(amount) || amount <= 0) {
      errors.push({ rowNumber, field: "amount", message: "Amount must be a positive number." })
      continue
    }

    if (type === "invoice") {
      const dueDateStr = get("duedate") || get("date")
      const dueDate = new Date(dueDateStr)
      if (isNaN(dueDate.getTime())) {
        errors.push({ rowNumber, field: "duedate", message: "Valid due date required (YYYY-MM-DD)." })
        continue
      }

      invoices.push({
        type: "invoice",
        rowNumber,
        supplierName,
        invoiceRef: get("invoiceref") || get("ref") || undefined,
        currency,
        amount,
        dueDate,
      })
    } else {
      // Default to PO
      const orderDateStr = get("orderdate") || get("date")
      const paymentDateStr = get("expectedpaymentdate") || get("paymentdate") || get("duedate")

      const orderDate = orderDateStr ? new Date(orderDateStr) : new Date()
      const paymentDate = paymentDateStr ? new Date(paymentDateStr) : new Date(Date.now() + 30 * 86400000)

      if (isNaN(orderDate.getTime())) {
        errors.push({ rowNumber, field: "orderdate", message: "Valid order date required." })
        continue
      }
      if (isNaN(paymentDate.getTime())) {
        errors.push({ rowNumber, field: "expectedpaymentdate", message: "Valid expected payment date required." })
        continue
      }

      pos.push({
        type: "po",
        rowNumber,
        supplierName,
        supplierRef: get("supplierref") || get("poref") || get("ref") || undefined,
        currency,
        amount,
        orderDate,
        expectedPaymentDate: paymentDate,
      })
    }
  }

  return { pos, invoices, errors, totalRows }
}
