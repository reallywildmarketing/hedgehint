/**
 * Rate alert rule evaluation.
 *
 * Checks active alert thresholds against newly observed rates.
 */

export interface AlertRule {
  id: string
  organisationId: string
  currencyPair: string // e.g. "GBP/USD"
  thresholdRate: number
  direction: "above" | "below"
  status: "active" | "dismissed" | "triggered"
}

export interface RateObservation {
  currencyPair: string
  rate: number
  observedAt: Date | string
}

export interface TriggeredAlert {
  alertId: string
  currencyPair: string
  thresholdRate: number
  observedRate: number
  direction: "above" | "below"
  message: string
}

export function evaluateAlerts(
  alerts: AlertRule[],
  rates: RateObservation[]
): TriggeredAlert[] {
  const triggered: TriggeredAlert[] = []

  const latestRatesByPair = new Map<string, number>()
  for (const r of rates) {
    latestRatesByPair.set(r.currencyPair, r.rate)
  }

  for (const alert of alerts) {
    if (alert.status !== "active") continue

    const currentRate = latestRatesByPair.get(alert.currencyPair)
    if (currentRate === undefined) continue

    const isTriggered =
      alert.direction === "above"
        ? currentRate >= alert.thresholdRate
        : currentRate <= alert.thresholdRate

    if (isTriggered) {
      triggered.push({
        alertId: alert.id,
        currencyPair: alert.currencyPair,
        thresholdRate: alert.thresholdRate,
        observedRate: currentRate,
        direction: alert.direction,
        message: `${alert.currencyPair} is now ${currentRate.toFixed(4)}, which crossed ${alert.direction} your target of ${alert.thresholdRate.toFixed(4)}.`,
      })
    }
  }

  return triggered
}
