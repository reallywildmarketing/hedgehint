"use client"

import { useState } from "react"

interface CurrencyData {
  currency: string
  totalForeign: number
  totalBase: number
  currentRate: number
}

export function WhatIfSlider({
  currencies,
  baseCurrency,
}: {
  currencies: CurrencyData[]
  baseCurrency: string
}) {
  const [shift, setShift] = useState(0)
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]?.currency || "USD")

  const target = currencies.find((c) => c.currency === selectedCurrency)
  if (!target) return null

  const shiftedRate = target.currentRate * (1 + shift / 100)
  const shiftedBaseCost = target.totalForeign * shiftedRate
  const costDelta = shiftedBaseCost - target.totalBase

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-serif font-bold text-slate-900">What-if Scenario</h2>
          <p className="text-xs text-slate-500">Model the impact of a currency shift on your landed costs</p>
        </div>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-semibold"
        >
          {currencies.map((c) => (
            <option key={c.currency} value={c.currency}>
              {c.currency}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Rate Shift</span>
          <span className={`font-mono font-bold ${shift > 0 ? "text-rose-600" : shift < 0 ? "text-emerald-600" : "text-slate-900"}`}>
            {shift > 0 ? "+" : ""}{shift}% ({selectedCurrency} {shift > 0 ? "strengthens" : "weakens"})
          </span>
        </div>
        <input
          type="range"
          min="-25"
          max="25"
          step="1"
          value={shift}
          onChange={(e) => setShift(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
        />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Baseline Cost</span>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              {baseCurrency} {target.totalBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-slate-400">@ {target.currentRate.toFixed(4)}</span>
          </div>

          <div className="bg-amber-50/50 p-3 rounded border border-amber-200/60">
            <span className="text-[10px] text-amber-800 uppercase font-semibold">Scenario Cost</span>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              {baseCurrency} {shiftedBaseCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <span className={`text-[10px] font-semibold ${costDelta > 0 ? "text-rose-600" : costDelta < 0 ? "text-emerald-600" : "text-slate-500"}`}>
              {costDelta > 0 ? `+${baseCurrency} ` : costDelta < 0 ? `-${baseCurrency} ` : ""}
              {Math.abs(costDelta).toLocaleString(undefined, { maximumFractionDigits: 0 })} delta
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
