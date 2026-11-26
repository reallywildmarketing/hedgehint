import { describe, it, expect } from "vitest"
import { calculateProductMargin } from "../src/domain/margin"
import { evaluateAlerts } from "../src/domain/alert"
import { parseAndValidateCSV } from "../src/domain/import"

describe("Margin Impact", () => {
  it("calculates gross profit and margin change under currency devaluation", () => {
    const margin = calculateProductMargin({
      productId: "P1",
      productName: "Solar Inverter",
      supplierName: "Shenzhen Power",
      currency: "USD",
      unitCostForeign: 100,
      sellingPriceBase: 150,
      currentRate: 0.8,
      scenarioShiftPercent: 10,
    })

    expect(margin.landedCostBase).toBe(80)
    expect(margin.grossProfitBase).toBe(70)
    expect(margin.marginPercent).toBeCloseTo(46.67, 1)

    // With +10% shift
    expect(margin.scenarioLandedCostBase).toBe(88)
    expect(margin.scenarioMarginPercent).toBeCloseTo(41.33, 1)
    expect(margin.scenarioMarginDeltaPercent).toBeCloseTo(-5.34, 1)
  })
})

describe("Alert Evaluation", () => {
  it("triggers alert when rate crosses threshold", () => {
    const alerts = [
      {
        id: "a1",
        organisationId: "org-1",
        currencyPair: "GBP/USD",
        thresholdRate: 0.82,
        direction: "above" as const,
        status: "active" as const,
      },
      {
        id: "a2",
        organisationId: "org-1",
        currencyPair: "GBP/EUR",
        thresholdRate: 0.80,
        direction: "below" as const,
        status: "active" as const,
      },
    ]

    const rates = [
      { currencyPair: "GBP/USD", rate: 0.83, observedAt: new Date() },
      { currencyPair: "GBP/EUR", rate: 0.85, observedAt: new Date() },
    ]

    const triggered = evaluateAlerts(alerts, rates)
    expect(triggered).toHaveLength(1)
    expect(triggered[0].alertId).toBe("a1")
    expect(triggered[0].observedRate).toBe(0.83)
  })
})

describe("CSV Parsing and Validation", () => {
  it("parses valid POs and Invoices and detects invalid rows", () => {
    const csv = `type,supplier,currency,amount,duedate,orderdate,paymentdate
po,Shenzhen Tech,USD,15000,,2026-11-01,2026-12-15
invoice,Berlin Gears,EUR,8500,2026-12-05,,
po,Bad Currency,INVALID,1000,,2026-11-01,2026-12-01
invoice,,USD,2000,2026-12-01,,
po,Negative Amount,USD,-500,,2026-11-01,2026-12-01
`
    const result = parseAndValidateCSV(csv)
    expect(result.pos).toHaveLength(1)
    expect(result.pos[0].supplierName).toBe("Shenzhen Tech")
    expect(result.pos[0].amount).toBe(15000)

    expect(result.invoices).toHaveLength(1)
    expect(result.invoices[0].supplierName).toBe("Berlin Gears")

    expect(result.errors).toHaveLength(3)
    expect(result.errors.find((e) => e.field === "currency")).toBeDefined()
    expect(result.errors.find((e) => e.field === "supplier")).toBeDefined()
    expect(result.errors.find((e) => e.field === "amount")).toBeDefined()
  })
})
