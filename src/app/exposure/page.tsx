import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { totalExposure, rateSensitivity } from "@/domain/exposure"
import { ExposureRibbon } from "@/components/exposure-ribbon"
import { WhatIfSlider } from "@/components/what-if-slider"
import Link from "next/link"

export default async function ExposurePage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")

  const orgId = auth.organisation.id
  const baseCurrency = auth.organisation.baseCurrency || "GBP"

  const [pos, invoices, rates] = await Promise.all([
    prisma.purchaseOrder.findMany({ where: { organisationId: orgId, status: "open" } }),
    prisma.supplierInvoice.findMany({ where: { organisationId: orgId, status: { in: ["open", "overdue"] } } }),
    prisma.exchangeRate.findMany({ where: { organisationId: orgId }, orderBy: { observedAt: "desc" } }),
  ])

  const cleanPos = pos.map((p) => ({
    id: p.id,
    supplierName: p.supplierName,
    currency: p.currency,
    amount: Number(p.amount),
    orderDate: p.orderDate,
    expectedPaymentDate: p.expectedPaymentDate,
    status: p.status,
  }))

  const cleanInvoices = invoices.map((i) => ({
    id: i.id,
    supplierName: i.supplierName,
    currency: i.currency,
    amount: Number(i.amount),
    dueDate: i.dueDate,
    status: i.status,
  }))

  const cleanRates = rates.map((r) => ({ currencyPair: r.currencyPair, rate: Number(r.rate) }))
  const exposure = totalExposure(cleanPos, cleanInvoices, cleanRates, baseCurrency)
  const sensitivity = rateSensitivity(cleanPos, cleanInvoices, cleanRates, baseCurrency, [-10, -5, 5, 10])

  const sliderCurrencies = exposure.byCurrency.map((c) => {
    const pair = `${baseCurrency}/${c.currency}`
    const r = cleanRates.find((x) => x.currencyPair === pair)?.rate ?? 1
    return {
      currency: c.currency,
      totalForeign: c.totalForeign,
      totalBase: c.totalBase,
      currentRate: r,
    }
  })

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Currency Exposure & Hedging Need</h1>
          <p className="text-xs text-slate-500">Breakdown of upcoming foreign payments by calendar week and rate sensitivity</p>
        </div>
        <Link href="/import" className="rounded bg-amber-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-700">
          + Import Records
        </Link>
      </div>

      {exposure.byCurrency.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
          <p className="text-sm text-slate-600">No open purchase orders or invoices.</p>
          <Link href="/import" className="mt-4 inline-block text-xs font-semibold text-amber-600 underline">
            Import records now &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Exposure Ribbons for each foreign currency */}
          <div className="space-y-4">
            {exposure.byCurrency.map((c) => (
              <ExposureRibbon
                key={c.currency}
                currency={c.currency}
                baseCurrency={baseCurrency}
                weekly={c.weekly}
              />
            ))}
          </div>

          {/* What-If Scenario Modeler */}
          {sliderCurrencies.length > 0 && (
            <WhatIfSlider currencies={sliderCurrencies} baseCurrency={baseCurrency} />
          )}

          {/* Rate Sensitivity Matrix */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-serif font-bold text-slate-900">Rate Sensitivity Table</h2>
            <p className="text-[11px] text-slate-500">Estimated cost change in {baseCurrency} if currency swings</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2">Currency</th>
                    <th className="py-2">Base Cost</th>
                    <th className="py-2">-10%</th>
                    <th className="py-2">-5%</th>
                    <th className="py-2">+5%</th>
                    <th className="py-2">+10%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {sensitivity.map((s) => (
                    <tr key={s.currency} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-900">{s.currency}</td>
                      <td className="py-2.5">{baseCurrency} {s.totalBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      {s.results.map((r) => (
                        <td key={r.shift} className={`py-2.5 ${(r.change ?? 0) > 0 ? "text-rose-600" : (r.change ?? 0) < 0 ? "text-emerald-600" : ""}`}>
                          {(r.change ?? 0) > 0 ? "+" : ""}{(r.change ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
