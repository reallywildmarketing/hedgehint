"use client"

import Link from "next/link"
import { CurrencyPreset } from "./simulator-presets"

export function StressTestCard({
  preset,
  rateShift,
  setRateShift,
  shockedCostGBP,
  varianceGBP,
}: {
  preset: CurrencyPreset
  rateShift: number
  setRateShift: (val: number) => void
  shockedCostGBP: number
  varianceGBP: number
}) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl p-5 text-white flex flex-col justify-between space-y-4 shadow-lg">
      <div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono uppercase text-slate-400">Stress Test Simulator</span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {preset.code}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Rate Move Sensitivity</span>
            <span
              className={`font-mono font-bold text-sm ${
                rateShift > 0 ? "text-rose-400" : rateShift < 0 ? "text-emerald-400" : "text-white"
              }`}
            >
              {rateShift > 0 ? "+" : ""}{rateShift}% {rateShift > 0 ? "Stronger" : "Weaker"}
            </span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            step="1"
            value={rateShift}
            onChange={(e) => setRateShift(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>-15% Devaluation</span>
            <span>Par</span>
            <span>+15% Surge</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400">Landed Cost in GBP:</span>
          <span className="text-2xl font-mono font-bold text-white tracking-tight">
            £{Math.round(shockedCostGBP).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-xs pt-2 border-t border-white/10">
          <span className="text-slate-400">Impact on Margins:</span>
          <span
            className={`font-mono font-bold ${
              varianceGBP > 0 ? "text-rose-400" : varianceGBP < 0 ? "text-emerald-400" : "text-slate-300"
            }`}
          >
            {varianceGBP > 0
              ? `+£${Math.round(varianceGBP).toLocaleString()} extra cost`
              : varianceGBP < 0
              ? `-£${Math.round(Math.abs(varianceGBP)).toLocaleString()} savings`
              : "Baseline cost"}
          </span>
        </div>
      </div>

      <Link
        href="/sign-up"
        className="w-full text-center py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
      >
        Protect My Overseas Payables &rarr;
      </Link>
    </div>
  )
}
