"use client"

import { decidePurchaseRequest, recordCurrencyBought } from "@/app/requests/actions"

export function RequestsQueue({
  requests,
  currentUserId,
}: {
  requests: any[]
  currentUserId: string
}) {
  if (requests.length === 0) {
    return <p className="text-xs text-slate-400 py-3 text-center">No purchase requests.</p>
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const isRequester = r.requestedBy === currentUserId
        return (
          <div key={r.id} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold">
                {Number(r.amount).toLocaleString()} {r.currency}
              </span>
              <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200">
                {r.status}
              </span>
            </div>
            {r.rationale && <p className="text-slate-600 italic text-[11px]">&ldquo;{r.rationale}&rdquo;</p>}
            {r.status === "requested" && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                {isRequester ? (
                  <span className="text-[10px] text-slate-400 italic">Cannot self-approve.</span>
                ) : (
                  <>
                    <form action={decidePurchaseRequest.bind(null, r.id, "approve", undefined)}>
                      <button className="rounded bg-emerald-600 text-white text-[11px] px-2 py-0.5 font-medium">
                        Approve
                      </button>
                    </form>
                    <form action={decidePurchaseRequest.bind(null, r.id, "reject", "Rejected by manager")}>
                      <button className="rounded bg-rose-600 text-white text-[11px] px-2 py-0.5 font-medium">
                        Reject
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
            {r.status === "approved" && (
              <form action={recordCurrencyBought} className="flex gap-2 items-center pt-2 border-t border-slate-200">
                <input type="hidden" name="requestId" value={r.id} />
                <input
                  name="rateAchieved"
                  type="number"
                  step="any"
                  placeholder="Achieved rate"
                  required
                  className="text-[11px] font-mono border rounded px-1.5 py-1 w-24 bg-white"
                />
                <input
                  name="marketRate"
                  type="number"
                  step="any"
                  placeholder="Market rate"
                  required
                  className="text-[11px] font-mono border rounded px-1.5 py-1 w-24 bg-white"
                />
                <button className="rounded bg-slate-900 text-white text-[11px] px-2.5 py-1 font-medium">
                  Record Buy
                </button>
              </form>
            )}
          </div>
        )
      })}
    </div>
  )
}
