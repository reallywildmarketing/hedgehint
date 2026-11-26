/**
 * Hedge timing recommendation.
 *
 * Pure function. Inputs are plain objects; output is a recommendation plus rationale.
 */

export interface RecommendationInput {
  currency: string
  totalForeign: number // exposure due in next 4 weeks
  currentRate: number // base per 1 foreign
  historicalAverageRate: number // base per 1 foreign, over lookback window
  riskAppetite: "low" | "medium" | "high"
}

export interface Recommendation {
  currency: string
  action: "buy_now" | "partial" | "wait"
  suggestedAmount: number // foreign currency
  rationale: string
  confidence: "low" | "medium" | "high"
}

/**
 * Recommend how much currency to buy now versus later.
 *
 * Logic:
 * - If current rate is better (lower) than historical average AND exposure is imminent
 *   (due within ~2 weeks) => lean towards buying now.
 * - If current rate is worse (higher) than average => wait, unless low risk appetite
 *   and exposure is large => partial hedge now.
 * - Risk appetite low => hedge more; high => wait more.
 */
export function recommend(input: RecommendationInput): Recommendation {
  const { currency, totalForeign, currentRate, historicalAverageRate, riskAppetite } = input
  const isFavorable = currentRate < historicalAverageRate // cheaper than average
  const exposureIsHigh = totalForeign > 0

  let action: Recommendation["action"] = "wait"
  let suggestedAmount = 0
  let confidence: Recommendation["confidence"] = "low"
  let rationale = ""

  if (!exposureIsHigh || totalForeign <= 0) {
    action = "wait"
    suggestedAmount = 0
    confidence = "low"
    rationale = `No upcoming ${currency} exposure in the next 4 weeks; no hedge needed.`
    return { currency, action, suggestedAmount, rationale, confidence }
  }

  const isLow = riskAppetite === "low"
  const isHigh = riskAppetite === "high"

  if (isFavorable) {
    // Rate is attractive vs history -> buy now, more so if risk-averse.
    action = isLow ? "buy_now" : "partial"
    suggestedAmount = isLow ? totalForeign : totalForeign * 0.5
    confidence = isLow ? "high" : "medium"
    rationale = `${currency} rate (${currentRate.toFixed(4)}) is below the historical average (${historicalAverageRate.toFixed(4)}), so buying now locks in a favourable rate for ${(totalForeign).toLocaleString()} ${currency} of exposure.`
  } else {
    // Rate is expensive vs history -> generally wait, but low appetite hedges partially.
    if (isLow) {
      action = "partial"
      suggestedAmount = totalForeign * 0.33
      confidence = "medium"
      rationale = `${currency} rate (${currentRate.toFixed(4)}) is above the historical average (${historicalAverageRate.toFixed(4)}). With low risk appetite, hedge a third now (${suggestedAmount.toLocaleString()} ${currency}) and reassess before the rest falls due.`
    } else {
      action = "wait"
      suggestedAmount = 0
      confidence = "medium"
      rationale = `${currency} rate (${currentRate.toFixed(4)}) is above the historical average (${historicalAverageRate.toFixed(4)}). Waiting may secure a better rate; monitor alerts for a favourable level.`
    }
  }

  return { currency, action, suggestedAmount, rationale, confidence }
}
