/**
 * What-if scenario: recompute exposure cost under a rate shift.
 * Pure function.
 */

import { totalExposure, type Rate, type PO, type Invoice } from "./exposure"

export interface ScenarioResult {
  currency: string
  totalForeign: number
  baseCost: number // at current rate
  shiftedBaseCost: number // at shifted rate
  deltaBase: number // shifted - base
  shiftPercent: number
}

/**
 * Recompute the base-currency cost of exposure under a rate shift (percent).
 * Positive shift = foreign currency strengthens (costs more base).
 */
export function scenario(
  pos: PO[],
  invoices: Invoice[],
  rates: Rate[],
  baseCurrency: string,
  shiftPercent: number
): ScenarioResult[] {
  const { byCurrency } = totalExposure(pos, invoices, rates, baseCurrency)

  return byCurrency.map((c) => {
    const rate = rates.find((r) => {
      const pair = `${baseCurrency}/${c.currency}`
      return r.currencyPair === pair
    })?.rate
    const baseCost = c.totalBase
    const shiftedBaseCost =
      rate != null ? c.totalForeign * rate * (1 + shiftPercent / 100) : baseCost
    return {
      currency: c.currency,
      totalForeign: c.totalForeign,
      baseCost,
      shiftedBaseCost,
      deltaBase: shiftedBaseCost - baseCost,
      shiftPercent,
    }
  })
}
