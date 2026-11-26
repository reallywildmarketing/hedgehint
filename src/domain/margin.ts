/**
 * Pure margin impact calculation.
 *
 * For importers selling goods locally in base currency but sourcing products
 * priced in foreign currency:
 * Landed cost in base = unitCostForeign * exchangeRate + additionalCostsBase
 * Margin % = (sellingPriceBase - landedCostBase) / sellingPriceBase * 100
 */

export interface ProductMarginInput {
  productId: string
  productName: string
  supplierName: string
  currency: string // foreign currency e.g. USD, EUR, CNY
  unitCostForeign: number
  sellingPriceBase: number
  additionalCostsBase?: number // shipping, duties, tariffs in base
  currentRate: number // base per 1 foreign
  scenarioShiftPercent?: number // optional what-if shift (+10 = foreign currency +10%)
}

export interface ProductMarginResult {
  productId: string
  productName: string
  supplierName: string
  currency: string
  unitCostForeign: number
  sellingPriceBase: number
  landedCostBase: number
  marginPercent: number
  grossProfitBase: number
  // If scenario is active
  scenarioLandedCostBase?: number
  scenarioMarginPercent?: number
  scenarioMarginDeltaPercent?: number
}

export function calculateProductMargin(input: ProductMarginInput): ProductMarginResult {
  const {
    productId,
    productName,
    supplierName,
    currency,
    unitCostForeign,
    sellingPriceBase,
    additionalCostsBase = 0,
    currentRate,
    scenarioShiftPercent,
  } = input

  const landedCostBase = unitCostForeign * currentRate + additionalCostsBase
  const grossProfitBase = sellingPriceBase - landedCostBase
  const marginPercent = sellingPriceBase > 0 ? (grossProfitBase / sellingPriceBase) * 100 : 0

  let scenarioLandedCostBase: number | undefined
  let scenarioMarginPercent: number | undefined
  let scenarioMarginDeltaPercent: number | undefined

  if (scenarioShiftPercent !== undefined && scenarioShiftPercent !== 0) {
    const shiftedRate = currentRate * (1 + scenarioShiftPercent / 100)
    scenarioLandedCostBase = unitCostForeign * shiftedRate + additionalCostsBase
    const scenarioGrossProfit = sellingPriceBase - scenarioLandedCostBase
    scenarioMarginPercent =
      sellingPriceBase > 0 ? (scenarioGrossProfit / sellingPriceBase) * 100 : 0
    scenarioMarginDeltaPercent = scenarioMarginPercent - marginPercent
  }

  return {
    productId,
    productName,
    supplierName,
    currency,
    unitCostForeign,
    sellingPriceBase,
    landedCostBase,
    marginPercent: Number(marginPercent.toFixed(2)),
    grossProfitBase: Number(grossProfitBase.toFixed(2)),
    scenarioLandedCostBase: scenarioLandedCostBase !== undefined ? Number(scenarioLandedCostBase.toFixed(2)) : undefined,
    scenarioMarginPercent: scenarioMarginPercent !== undefined ? Number(scenarioMarginPercent.toFixed(2)) : undefined,
    scenarioMarginDeltaPercent: scenarioMarginDeltaPercent !== undefined ? Number(scenarioMarginDeltaPercent.toFixed(2)) : undefined,
  }
}
