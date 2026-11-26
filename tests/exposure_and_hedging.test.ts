import { describe, it, expect } from "vitest"
import { toMonday, weeklyNeeds, totalExposure, rateSensitivity } from "../src/domain/exposure"
import { recommend } from "../src/domain/recommendation"
import { scenario } from "../src/domain/scenario"

describe("Exposure calculations", () => {
  it("computes Monday of week correctly", () => {
    expect(toMonday("2026-11-26")).toBe("2026-11-23")
    expect(toMonday("2026-11-29")).toBe("2026-11-23")
    expect(toMonday("2026-11-23")).toBe("2026-11-23")
  })

  it("calculates weekly foreign currency needs", () => {
    const pos = [
      {
        id: "1",
        supplierName: "Shenzhen Electronics",
        currency: "USD",
        amount: 50000,
        orderDate: "2026-11-01",
        expectedPaymentDate: "2026-12-01",
        status: "open",
      },
    ]
    const invoices = [
      {
        id: "2",
        supplierName: "Euro Components",
        currency: "EUR",
        amount: 20000,
        dueDate: "2026-12-03",
        status: "open",
      },
    ]
    const rates = [
      { currencyPair: "GBP/USD", rate: 0.8 },
      { currencyPair: "GBP/EUR", rate: 0.85 },
    ]

    const weekly = weeklyNeeds(pos, invoices, rates, "GBP")
    expect(weekly.has("USD")).toBe(true)
    expect(weekly.has("EUR")).toBe(true)

    const usdWeek = weekly.get("USD")?.get("2026-11-30")
    expect(usdWeek?.amount).toBe(50000)
    expect(usdWeek?.baseValue).toBe(40000)
  })

  it("computes total exposure and rate sensitivity", () => {
    const pos = [
      {
        id: "1",
        supplierName: "Acme USD",
        currency: "USD",
        amount: 100000,
        orderDate: "2026-11-01",
        expectedPaymentDate: "2026-12-01",
        status: "open",
      },
    ]
    const rates = [{ currencyPair: "GBP/USD", rate: 0.8 }]
    const sensitivity = rateSensitivity(pos, [], rates, "GBP", [-10, 10])

    expect(sensitivity).toHaveLength(1)
    expect(sensitivity[0].currency).toBe("USD")
    expect(sensitivity[0].totalBase).toBe(80000)

    const plus10 = sensitivity[0].results.find((r) => r.shift === 10)
    expect(plus10?.newBase).toBeCloseTo(88000)
    expect(plus10?.change).toBeCloseTo(8000)
  })
})

describe("Hedging recommendations", () => {
  it("recommends buy_now when rate is favourable for low risk appetite", () => {
    const res = recommend({
      currency: "USD",
      totalForeign: 50000,
      currentRate: 0.75,
      historicalAverageRate: 0.8,
      riskAppetite: "low",
    })
    expect(res.action).toBe("buy_now")
    expect(res.suggestedAmount).toBe(50000)
    expect(res.confidence).toBe("high")
  })

  it("recommends wait when rate is unfavourable and risk appetite is high", () => {
    const res = recommend({
      currency: "EUR",
      totalForeign: 30000,
      currentRate: 0.9,
      historicalAverageRate: 0.85,
      riskAppetite: "high",
    })
    expect(res.action).toBe("wait")
    expect(res.suggestedAmount).toBe(0)
  })
})

describe("What-if Scenarios", () => {
  it("calculates cost delta when rate shifts by +10%", () => {
    const pos = [
      {
        id: "1",
        supplierName: "Acme Import",
        orderDate: "2026-11-01",
        currency: "USD",
        amount: 100000,
        expectedPaymentDate: "2026-12-01",
        status: "open",
      },
    ]
    const rates = [{ currencyPair: "GBP/USD", rate: 0.8 }]
    const results = scenario(pos, [], rates, "GBP", 10)

    expect(results).toHaveLength(1)
    expect(results[0].baseCost).toBe(80000)
    expect(results[0].shiftedBaseCost).toBeCloseTo(88000)
    expect(results[0].deltaBase).toBeCloseTo(8000)
  })
})
