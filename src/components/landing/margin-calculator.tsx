"use client"

import { useState } from "react"

export function MarginCalculator() {
  const [fxMove, setFxMove] = useState(10) // +10% adverse move

  const unitCostUSD = 120 // e.g. imported container goods
  const retailPriceGBP = 160
  const baselineRate = 0.78 // GBP/USD -> £93.60 landed cost
  const shockedRate = baselineRate * (1 + fxMove / 100)

  const baselineLanded = unitCostUSD * baselineRate
  const baselineMarginPct = ((retailPriceGBP - baselineLanded) / retailPriceGBP) * 100

  const shockedLanded = unitCostUSD * shockedRate
  const shockedMarginPct = ((retailPriceGBP - shockedLanded) / retailPriceGBP) * 100
  const marginLossPoints = baselineMarginPct - shockedMarginPct

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-6 md:p-8 shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Landed Margin Protection
          </span>
          <h3 className="font-serif font-bold text-xl text-slate-900 mt-1">
            See the exact margin erosion on imported SKUs
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">SKU: INV-SOLAR-400W</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Simulated Currency Devaluation:</span>
              <span className="font-mono text-amber-800">+{fxMove}% USD surge</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={fxMove}
              onChange={(e) => setFxMove(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Factory Price</p>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">${unitCostUSD}.00 USD</p>
              <p className="text-[10px] text-slate-500">Retail: £{retailPriceGBP}.00 GBP</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">New Landed Unit Cost</p>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">£{shockedLanded.toFixed(2)}</p>
              <p className="text-[10px] text-rose-600 font-semibold">+£{(shockedLanded - baselineLanded).toFixed(2)} per unit</p>
            </div>
          </div>
        </div>

        {/* Margin Dial Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 text-white text-center space-y-2 shadow-inner">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Gross Margin Under Shock</p>
          <p className="text-4xl font-mono font-bold text-amber-400">
            {shockedMarginPct.toFixed(1)}%
          </p>
          <p className="text-[11px] text-rose-400 font-medium">
            &darr; -{marginLossPoints.toFixed(1)}% margin lost to FX
          </p>
          <div className="pt-2 text-[10px] text-slate-400 border-t border-white/10">
            Autopilot Hedge preserves baseline: <span className="text-white font-semibold">{baselineMarginPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
