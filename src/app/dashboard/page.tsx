import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardData } from "@/lib/dashboard-data"
import Link from "next/link"

export default async function DashboardPage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")

  const org = auth.organisation
  const data = await getDashboardData(org.id, org.baseCurrency, org.riskAppetite)

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">{org.name}</h1>
          <p className="text-xs text-slate-500">
            Base: <span className="font-semibold text-slate-700">{org.baseCurrency}</span> &bull; Risk:{" "}
            <span className="font-semibold text-slate-700 capitalize">{org.riskAppetite}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/import" className="rounded-lg bg-amber-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-700">
            Import CSV
          </Link>
          <Link href="/requests" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white text-xs font-medium hover:bg-slate-800">
            Request Hedge
          </Link>
        </div>
      </div>

      {data.isStaleRates && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex justify-between">
          <span>Rates are older than 60m.</span>
          <Link href="/rates" className="underline font-semibold">Update &rarr;</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Exposure</p>
          <p className="text-xl font-mono font-bold mt-1 text-slate-900">
            {org.baseCurrency} {data.exposure.grandBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <Link href="/exposure" className="text-[11px] text-amber-600 hover:underline">Schedule &rarr;</Link>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-semibold">Due / Overdue</p>
          <p className={`text-xl font-mono font-bold mt-1 ${data.overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {data.overdueCount}
          </p>
          <span className="text-[11px] text-slate-400">Supplier invoices</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-semibold">Pending Approvals</p>
          <p className="text-xl font-mono font-bold mt-1 text-amber-600">{data.requestsCount}</p>
          <Link href="/requests" className="text-[11px] text-amber-600 hover:underline">Queue &rarr;</Link>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 uppercase font-semibold">Active Alerts</p>
          <p className="text-xl font-mono font-bold mt-1 text-slate-900">{data.alertsCount}</p>
          <Link href="/alerts" className="text-[11px] text-amber-600 hover:underline">Manage &rarr;</Link>
        </div>
      </div>

      {data.cleanPos.length === 0 && data.cleanInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <h2 className="font-serif font-semibold text-slate-900">No exposure data imported yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Upload purchase orders or invoices to calculate future foreign-currency needs.</p>
          <Link href="/import" className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-white text-xs font-medium">
            Import POs & Invoices
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
            <h2 className="text-sm font-serif font-bold text-slate-900">Currency Breakdown</h2>
            <div className="space-y-2">
              {data.exposure.byCurrency.map((item) => (
                <div key={item.currency} className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="font-mono font-bold">{item.currency} ({item.totalForeign.toLocaleString()})</span>
                  <span className="font-mono text-slate-700">~{org.baseCurrency} {item.totalBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
            <h2 className="text-sm font-serif font-bold text-slate-900">Autopilot Advice</h2>
            <div className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="capitalize">{rec.action.replace("_", " ")}</span>
                    <span className="uppercase text-[10px] text-slate-500">{rec.currency}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
