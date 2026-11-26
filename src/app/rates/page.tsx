import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { addManualRate } from "./actions"

export default async function RatesPage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")

  const rates = await prisma.exchangeRate.findMany({
    where: { organisationId: auth.organisation.id },
    orderBy: { observedAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Exchange Rates</h1>
        <p className="text-xs text-slate-500">
          Live & historical exchange rates used to calculate exposure and cost variations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Manual Rate Input */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-serif font-bold text-slate-900">Enter / Override Rate</h2>
          <form action={addManualRate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Currency Pair (e.g. GBP/USD)
              </label>
              <input
                name="currencyPair"
                placeholder="GBP/USD"
                required
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-amber-500 outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Rate (Base per 1 Foreign)
              </label>
              <input
                name="rate"
                type="number"
                step="0.000001"
                placeholder="0.7925"
                required
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-amber-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded bg-slate-900 text-white text-xs font-medium py-2 hover:bg-slate-800"
            >
              Record Rate
            </button>
          </form>
        </div>

        {/* Rates Table */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-serif font-bold text-slate-900">Recent Rate Observations</h2>
          {rates.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No rates recorded yet. Add your first rate above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2">Pair</th>
                    <th className="py-2">Rate</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Observed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {rates.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 font-bold text-slate-900">{r.currencyPair}</td>
                      <td className="py-2.5">{Number(r.rate).toFixed(4)}</td>
                      <td className="py-2.5 uppercase text-[10px] text-slate-500">{r.source}</td>
                      <td className="py-2.5 text-slate-500 text-[11px]">
                        {new Date(r.observedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
