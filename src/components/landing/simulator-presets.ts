export interface CurrencyPreset {
  code: string
  name: string
  symbol: string
  samplePayable: number
  baseRate: number
  benchmarkRate: number
  weeks: { label: string; amount: number }[]
}

export const PRESETS: Record<string, CurrencyPreset> = {
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    samplePayable: 85000,
    baseRate: 0.792,
    benchmarkRate: 0.805,
    weeks: [
      { label: "W48", amount: 25000 },
      { label: "W49", amount: 15000 },
      { label: "W50", amount: 30000 },
      { label: "W51", amount: 15000 },
    ],
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    samplePayable: 62000,
    baseRate: 0.854,
    benchmarkRate: 0.862,
    weeks: [
      { label: "W48", amount: 20000 },
      { label: "W49", amount: 22000 },
      { label: "W50", amount: 10000 },
      { label: "W51", amount: 10000 },
    ],
  },
  NGN: {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    samplePayable: 145000000,
    baseRate: 0.00049,
    benchmarkRate: 0.00052,
    weeks: [
      { label: "W48", amount: 45000000 },
      { label: "W49", amount: 50000000 },
      { label: "W50", amount: 30000000 },
      { label: "W51", amount: 20000000 },
    ],
  },
  CNY: {
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "¥",
    samplePayable: 420000,
    baseRate: 0.109,
    benchmarkRate: 0.113,
    weeks: [
      { label: "W48", amount: 120000 },
      { label: "W49", amount: 180000 },
      { label: "W50", amount: 80000 },
      { label: "W51", amount: 40000 },
    ],
  },
}
