import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ReportsPage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")

  const orgId = auth.organisation.id
  const baseCurrency = auth.organisation.baseCurrency || "GBP"

  const buys = await prisma.currencyBought.findMany({
    where: { organisationId: orgId },
    orderBy: { boughtAt: "desc" },
  })

  let totalSavingsBase = 0
  let totalVolumeBase = 0

  const summaryByCurrency = new Map<string, { volume: number; savings: number; count: number }>()

  for (const b of buys) {
    const saving = Number(b.savingBaseCurrency)
    const amount = Number(b.amount)
    const rate = Number(b.rateAchieved)

    totalSavingsBase += saving
    totalVolumeBase += amount * rate

    const cur = summaryByCurrency.get(b.currency) || { volume: 0, savings: 0, count: 0 }
    cur.volume += amount
    cur.savings += saving
    cur.count += 1
    summaryByCurrency.set(b.currency, cur)
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Currency Gains, Losses & Savings Report</h1>
        <p className="text-xs text-slate-500">
          Monthly audit of executed hedges, realized exchange-rate savings, and variance against spot markets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase font-semibold text-slate-500">Total Currency Hedged</p>
          <p className="text-2xl font-mono font-bold text-slate-900 mt-1">
            {baseCurrency} {totalVolumeBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase font-semibold text-slate-500">Net Realised Savings</p>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalSavingsBase >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {totalSavingsBase >= 0 ? "+" : ""}{baseCurrency} {totalSavingsBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase font-semibold text-slate-500">Executions</p>
          <p className="text-2xl font-mono font-bold text-slate-900 mt-1">{buys.length}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-serif font-bold text-slate-900">Breakdown by Currency</h2>
        {summaryByCurrency.size === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No hedge executions recorded for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans font-semibold">
                  <th className="py-2">Currency</th>
                  <th className="py-2">Executions</th>
                  <th className="py-2">Total Bought</th>
                  <th className="py-2">Net Savings ({baseCurrency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from(summaryByCurrency.entries()).map(([curr, s]) => (
                  <tr key={curr}>
                    <td className="py-2.5 font-bold text-slate-900">{curr}</td>
                    <td className="py-2.5">{s.count}</td>
                    <td className="py-2.5">{s.volume.toLocaleString()} {curr}</td>
                    <td className={`py-2.5 font-bold ${s.savings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {s.savings >= 0 ? "+" : ""}{s.savings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
