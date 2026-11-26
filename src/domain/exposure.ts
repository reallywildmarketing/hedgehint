/**
 * Pure exposure calculations.
 *
 * Inputs are plain objects (not Prisma models) so these functions can be tested
 * without a database. Amounts are Decimal-like numbers (handled as JS numbers;
 * financial rounding is applied at display time).
 *
 * rate = base currency per 1 unit of foreign currency.
 * e.g. for organisation base GBP and invoice currency USD, rate GBP/USD = 1.25 means
 * 1 USD costs 1.25 GBP.
 */

export interface PO {
  id: string
  supplierName: string
  supplierRef?: string | null
  currency: string // ISO 4217, e.g. "USD"
  amount: number
  orderDate: Date | string
  expectedPaymentDate: Date | string
  status: string // open|paid|cancelled
}

export interface Invoice {
  id: string
  purchaseOrderId?: string | null
  supplierName: string
  invoiceRef?: string | null
  currency: string
  amount: number
  dueDate: Date | string
  status: string // open|paid|overdue|cancelled
}

export interface Rate {
  currencyPair: string // e.g. "GBP/USD"
  rate: number // base per 1 foreign
}

export interface WeeklyBucket {
  weekStart: string // ISO date (Monday)
  amount: number // foreign currency
  baseValue: number // converted to base currency at current rate
}

export interface ExposureByCurrency {
  currency: string
  totalForeign: number
  totalBase: number
  weekly: WeeklyBucket[]
}

export function toMonday(date: Date | string): string {
  const d =
    typeof date === "string"
      ? new Date(date + (date.length === 10 ? "T00:00:00Z" : ""))
      : new Date(date)
  const day = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + mondayOffset)
  return d.toISOString().slice(0, 10)
}

export function rateFor(rates: Rate[], baseCurrency: string, foreign: string): number | null {
  if (baseCurrency === foreign) return 1
  const pair = `${baseCurrency}/${foreign}`
  const r = rates.find((x) => x.currencyPair === pair)
  return r ? r.rate : null
}

/**
 * Future foreign-currency needs by currency and week, for open (unpaid) records.
 */
export function weeklyNeeds(
  pos: PO[],
  invoices: Invoice[],
  rates: Rate[],
  baseCurrency: string
): Map<string, Map<string, WeeklyBucket>> {
  const byCurrency = new Map<string, Map<string, WeeklyBucket>>()

  const add = (currency: string, amount: number, date: Date | string) => {
    if (!byCurrency.has(currency)) byCurrency.set(currency, new Map())
    const weekMap = byCurrency.get(currency)!
    const week = toMonday(date)
    const cur = weekMap.get(week) ?? { weekStart: week, amount: 0, baseValue: 0 }
    const rate = rateFor(rates, baseCurrency, currency)
    cur.amount += amount
    cur.baseValue += rate != null ? amount * rate : 0
    weekMap.set(week, cur)
  }

  for (const po of pos) {
    if (po.status !== "open") continue
    add(po.currency, po.amount, po.expectedPaymentDate)
  }
  for (const inv of invoices) {
    if (inv.status !== "open" && inv.status !== "overdue") continue
    add(inv.currency, inv.amount, inv.dueDate)
  }

  // Sort weeks ascending within each currency.
  for (const [, weekMap] of byCurrency) {
    const sorted = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    weekMap.clear()
    for (const [k, v] of sorted) weekMap.set(k, v)
  }
  return byCurrency
}

/**
 * Total exposure per currency (foreign + base), plus grand total in base.
 */
export function totalExposure(
  pos: PO[],
  invoices: Invoice[],
  rates: Rate[],
  baseCurrency: string
) {
  const weekly = weeklyNeeds(pos, invoices, rates, baseCurrency)
  const byCurrency: ExposureByCurrency[] = []
  let grandBase = 0

  for (const [currency, weekMap] of weekly) {
    let totalForeign = 0
    let totalBase = 0
    const weeklyArr: WeeklyBucket[] = []
    for (const bucket of weekMap.values()) {
      totalForeign += bucket.amount
      totalBase += bucket.baseValue
      weeklyArr.push(bucket)
    }
    grandBase += totalBase
    byCurrency.push({ currency, totalForeign, totalBase, weekly: weeklyArr })
  }

  byCurrency.sort((a, b) => b.totalBase - a.totalBase)
  return { byCurrency, grandBase }
}

/**
 * Rate sensitivity: cost change in base for given percent moves in the foreign rate.
 * A positive shift means the foreign currency strengthens (costs more base).
 */
export function rateSensitivity(
  pos: PO[],
  invoices: Invoice[],
  rates: Rate[],
  baseCurrency: string,
  shifts: number[] = [-10, -5, 5, 10]
) {
  const { byCurrency, grandBase } = totalExposure(pos, invoices, rates, baseCurrency)

  return byCurrency.map((c) => {
    const results = shifts.map((s) => {
      // New base = totalForeign * rate * (1 + s/100)
      // We need current rate; reconstruct totalBase / totalForeign if rate known.
      const rate = rateFor(rates, baseCurrency, c.currency)
      const newBase = rate != null ? c.totalForeign * rate * (1 + s / 100) : null
      const change = newBase != null ? newBase - c.totalBase : null
      return { shift: s, newBase, change }
    })
    return { currency: c.currency, totalBase: c.totalBase, results }
  })
}
