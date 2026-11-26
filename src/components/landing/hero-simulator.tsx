"use client"

import { useState } from "react"
import { PRESETS } from "./simulator-presets"
import { SimulatorRibbon } from "./simulator-ribbon"
import { StressTestCard } from "./stress-test-card"

export function HeroSimulator() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD")
  const [rateShift, setRateShift] = useState<number>(5)

  const preset = PRESETS[selectedCurrency]
  const currentRate = preset.baseRate * (1 + rateShift / 100)
  const baselineCostGBP = preset.samplePayable * preset.baseRate
  const shockedCostGBP = preset.samplePayable * currentRate
  const varianceGBP = shockedCostGBP - baselineCostGBP

  const isFavorable = currentRate < preset.benchmarkRate
  const recommendation = isFavorable ? "BUY NOW (LOCK 70%)" : rateShift > 8 ? "PARTIAL HEDGE (35%)" : "MONITOR / WAIT"
  const recommendationColor = isFavorable
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : rateShift > 8
    ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
    : "bg-slate-500/10 text-slate-700 border-slate-500/20"

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-2xl shadow-slate-200/60 p-6 md:p-8 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              Interactive Autopilot Simulator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Illustrative figures &bull; Select a supplier currency below</p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/60 self-start sm:self-auto">
          {Object.keys(PRESETS).map((code) => (
            <button
              key={code}
              onClick={() => setSelectedCurrency(code)}
              className={`rounded-md px-3 py-1 text-xs font-mono font-bold transition-all ${
                selectedCurrency === code ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        <div className="lg:col-span-7 space-y-4">
          <SimulatorRibbon preset={preset} currentRate={currentRate} />

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">HedgeHint Autopilot</span>
              <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${recommendationColor}`}>
                {recommendation}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {preset.code} rate ({currentRate.toFixed(4)}) is currently {rateShift > 0 ? "elevated" : "discounted"} vs 30-day baseline.{" "}
              {isFavorable ? "Lock in 70% before rate reverts to historical mean." : "Stagger purchases across W48 and W50 to mitigate downside variance."}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <StressTestCard
            preset={preset}
            rateShift={rateShift}
            setRateShift={setRateShift}
            shockedCostGBP={shockedCostGBP}
            varianceGBP={varianceGBP}
          />
        </div>
      </div>
    </div>
  )
}
