import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createPurchaseRequest } from "./actions"
import { RequestsQueue } from "@/components/requests-queue"

export default async function RequestsPage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")

  const orgId = auth.organisation.id
  const currentUserId = auth.user.id

  const [requests, buys] = await Promise.all([
    prisma.purchaseRequest.findMany({
      where: { organisationId: orgId },
      include: { requester: true },
      orderBy: { requestedAt: "desc" },
    }),
    prisma.currencyBought.findMany({
      where: { organisationId: orgId },
      orderBy: { boughtAt: "desc" },
    }),
  ])

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Purchase Requests & Approvals</h1>
        <p className="text-xs text-slate-500">Separation of duties: A requester cannot approve their own purchase request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-serif font-bold text-slate-900">New Request</h2>
          <form action={createPurchaseRequest} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Currency</label>
              <input name="currency" placeholder="USD" required className="w-full font-mono border rounded p-1.5 uppercase" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Amount</label>
              <input name="amount" type="number" step="any" placeholder="50000" required className="w-full font-mono border rounded p-1.5" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Target Rate</label>
              <input name="targetRate" type="number" step="any" placeholder="0.79" className="w-full font-mono border rounded p-1.5" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Rationale</label>
              <textarea name="rationale" rows={2} placeholder="Due date in 10 days" className="w-full border rounded p-1.5" />
            </div>
            <button type="submit" className="w-full bg-amber-600 text-white font-medium py-1.5 rounded">Submit Request</button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-serif font-bold text-slate-900">Approval Queue</h2>
            <RequestsQueue requests={requests} currentUserId={currentUserId} />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-sm font-serif font-bold text-slate-900">Currency Bought vs Market</h2>
            {buys.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">No purchases executed yet.</p>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b text-slate-500 font-sans">
                    <th className="py-1">Currency</th>
                    <th className="py-1">Amount</th>
                    <th className="py-1">Achieved</th>
                    <th className="py-1">Market</th>
                    <th className="py-1">Saving / Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buys.map((b) => (
                    <tr key={b.id}>
                      <td className="py-1.5 font-bold">{b.currency}</td>
                      <td className="py-1.5">{Number(b.amount).toLocaleString()}</td>
                      <td className="py-1.5">{Number(b.rateAchieved).toFixed(4)}</td>
                      <td className="py-1.5">{Number(b.marketRateAtPurchase).toFixed(4)}</td>
                      <td className={`py-1.5 font-bold ${Number(b.savingBaseCurrency) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {Number(b.savingBaseCurrency) >= 0 ? "+" : ""}{Number(b.savingBaseCurrency).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
