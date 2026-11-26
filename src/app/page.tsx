"use client"

import { useState } from "react"
import Link from "next/link"

export default function LandingPage() {
  const [shift, setShift] = useState(0)

  const baseForeignAmount = 100000 // USD payable (illustrative)
  const baseRate = 1.25 // GBP per USD (illustrative)
  const shiftedRate = baseRate * (1 + shift / 100)
  const baseCost = baseForeignAmount * baseRate
  const shiftedCost = baseForeignAmount * shiftedRate
  const delta = shiftedCost - baseCost

  return (
    <div className="flex flex-col bg-slate-50 text-slate-900">
      <section className="px-6 py-14 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 mb-4">
            FX exposure autopilot for importers
          </div>
          <h1 className="text-4xl font-serif font-semibold tracking-tight mb-6">
            Know what you owe in foreign currency &mdash; before the rate moves.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            HedgeHint reads your purchase orders and supplier invoices, works out how
            much of each currency you&rsquo;ll need and when, and recommends when to buy
            currency &mdash; so a swing in the naira, dollar or euro doesn&rsquo;t wipe
            out your margin.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm mb-14">
          <h2 className="text-xl font-serif font-semibold mb-2">
            What if the exchange rate moves?
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Illustrative example only &mdash; figures and names are not real customer
            data.
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Sample USD payable</span>
                <span className="font-mono text-slate-900">${baseForeignAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">Rate move</span>
                <span className={`font-mono text-slate-900 ${shift >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {shift >= 0 ? "+" : ""}{shift}%
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
              <p className="text-sm text-amber-800 mb-2">Estimated cost in GBP:</p>
              <p className="text-3xl font-mono font-bold text-amber-900">
                £{shiftedCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
              <p className="text-sm mt-2">
                {delta >= 0 ? `+£${delta.toLocaleString()}` : `£${Math.abs(delta).toLocaleString()}`} vs current
                rate &mdash; illustrative only.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-6 py-14">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-serif font-semibold mb-4">Get started</h2>
          <p className="text-slate-600 mb-6">
            Create an organisation, import your first purchase orders, and see your
            exposure. No demo data &mdash; only your own records.
          </p>
          <Link href="/sign-up" className="inline-block rounded-lg bg-amber-600 px-6 py-3 text-white font-medium hover:bg-amber-700">
            Request access
          </Link>
          <p className="text-xs text-slate-500 mt-6">
            Sign-up creates a pending request; an administrator approves it before you
            can sign in.
          </p>
        </div>
      </section>
    </div>
  )
}
