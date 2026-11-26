"use client"

import { CurrencyPreset } from "./simulator-presets"

export function SimulatorRibbon({
  preset,
  currentRate,
}: {
  preset: CurrencyPreset
  currentRate: number
}) {
  const maxWeekAmount = Math.max(...preset.weeks.map((w) => w.amount))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Upcoming Payment Schedule</p>
          <h4 className="font-serif font-bold text-slate-900 text-lg">
            {preset.symbol}{preset.samplePayable.toLocaleString()} {preset.code} Total Due
          </h4>
        </div>
        <span className="text-xs font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-600">
          Base: GBP
        </span>
      </div>

      <div className="pt-2">
        <div className="flex items-end gap-3 h-32 border-b border-slate-200 pb-2">
          {preset.weeks.map((w, idx) => {
            const heightPct = Math.max((w.amount / maxWeekAmount) * 100, 15)
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none shadow">
                  {preset.symbol}{w.amount.toLocaleString()} (~£{Math.round(w.amount * currentRate).toLocaleString()})
                </div>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t transition-all duration-300 ${
                    idx === 0
                      ? "bg-amber-500 hover:bg-amber-600"
                      : idx === 1
                      ? "bg-amber-400 hover:bg-amber-500"
                      : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
                <span className="text-[10px] font-mono text-slate-500 mt-2 font-semibold">{w.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-2">
          <span>Next 7 Days (Urgent)</span>
          <span>4-Week Horizon</span>
        </div>
      </div>
    </div>
  )
}
