"use client"

import { WeeklyBucket } from "@/domain/exposure"

interface ExposureRibbonProps {
  currency: string
  baseCurrency: string
  weekly: WeeklyBucket[]
}

export function ExposureRibbon({ currency, baseCurrency, weekly }: ExposureRibbonProps) {
  if (weekly.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
        No upcoming payments scheduled for {currency}.
      </div>
    )
  }

  const maxAmount = Math.max(...weekly.map((w) => w.amount), 1)

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-serif font-bold text-slate-900">{currency} Weekly Schedule (Exposure Ribbon)</h3>
          <p className="text-[11px] text-slate-500">Upcoming foreign currency payable by calendar week</p>
        </div>
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {currency}
        </span>
      </div>

      <div className="pt-4 flex items-end gap-3 h-36 border-b border-slate-200 pb-2 overflow-x-auto">
        {weekly.map((w) => {
          const heightPercent = Math.max((w.amount / maxAmount) * 100, 6)
          return (
            <div key={w.weekStart} className="flex-1 min-w-[50px] flex flex-col items-center group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow">
                {w.amount.toLocaleString()} {currency} (~{baseCurrency} {w.baseValue.toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </div>

              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full bg-amber-500 hover:bg-amber-600 transition-colors rounded-t cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                {w.weekStart.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
