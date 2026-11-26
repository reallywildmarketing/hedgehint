import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createRateAlert, dismissRateAlert } from "./actions"

export default async function AlertsPage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")

  const alerts = await prisma.rateAlert.findMany({
    where: { organisationId: auth.organisation.id },
    orderBy: { status: "asc" },
  })

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Exchange Rate Alerts</h1>
        <p className="text-xs text-slate-500">
          Get notified when currency crosses a target buy level or exceeds a risk tolerance threshold.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-serif font-bold text-slate-900">New Alert Rule</h2>
          <form action={createRateAlert} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Currency Pair</label>
              <input name="currencyPair" placeholder="GBP/USD" required className="w-full font-mono border rounded p-1.5 uppercase" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Threshold Rate</label>
              <input name="thresholdRate" type="number" step="0.0001" placeholder="0.7800" required className="w-full font-mono border rounded p-1.5" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Trigger When Rate Moves</label>
              <select name="direction" className="w-full border rounded p-1.5 bg-white">
                <option value="below">Below threshold (Favourable buy target)</option>
                <option value="above">Above threshold (Risk warning)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-medium py-1.5 rounded hover:bg-slate-800">
              Create Alert
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-serif font-bold text-slate-900">Alert Rules</h2>
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No alert rules configured.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((a) => (
                <div key={a.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{a.currencyPair}</span>{" "}
                    <span className="text-slate-500">
                      is {a.direction} {Number(a.thresholdRate).toFixed(4)}
                    </span>
                    <span className={`ml-2 uppercase text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      a.status === "triggered" ? "bg-rose-100 text-rose-800" :
                      a.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  {a.status !== "dismissed" && (
                    <form action={dismissRateAlert.bind(null, a.id)}>
                      <button className="text-[11px] text-slate-400 hover:text-slate-700">Dismiss</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
