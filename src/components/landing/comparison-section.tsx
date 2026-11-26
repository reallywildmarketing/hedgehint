export function ComparisonSection() {
  const comparisons = [
    {
      category: "Exposure Tracking",
      traditional: "Clunky Excel sheets with manually entered POs that go stale the next day.",
      hedgehint: "Automated weekly cashflow buckets generated from uploaded POs & supplier invoices.",
    },
    {
      category: "Purchase Timing",
      traditional: "Gut-feel decisions or panic buying currency when the invoice is already due.",
      hedgehint: "Data-driven autopilot advice ('Buy now 70% vs Wait') benchmarked against 30-day averages.",
    },
    {
      category: "Scenario Stress-Testing",
      traditional: "Surprise margin collapse when the dollar or naira surges unexpectedly.",
      hedgehint: "Interactive what-if simulations modeling exact landed cost swings before committing.",
    },
    {
      category: "Governance & Approvals",
      traditional: "Single individual calls the FX broker with no dual authorization or check.",
      hedgehint: "Strict 4-eye separation of duties: requesters cannot approve their own currency orders.",
    },
    {
      category: "Performance Audit",
      traditional: "Zero visibility into whether past currency conversions beat or lagged spot markets.",
      hedgehint: "Monthly audit tracking exact rate achieved vs spot market rate and net currency savings.",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Spreadsheet guesswork vs. Autonomous discipline
        </h2>
        <p className="text-slate-600 text-sm">
          Why growing importers replace manual FX trackers with an automated risk operating system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-rose-600 font-bold text-lg">&times;</span>
            <h3 className="font-serif font-bold text-slate-900 text-base">Spreadsheets & Bank Desks</h3>
          </div>
          <div className="space-y-4 divide-y divide-rose-100/60 text-xs text-slate-600">
            {comparisons.map((c, i) => (
              <div key={i} className={i > 0 ? "pt-3 space-y-1" : "space-y-1"}>
                <p className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider">{c.category}</p>
                <p>{c.traditional}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/20 p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-lg">&check;</span>
            <h3 className="font-serif font-bold text-slate-900 text-base">The HedgeHint Autopilot</h3>
          </div>
          <div className="space-y-4 divide-y divide-emerald-100/60 text-xs text-slate-700">
            {comparisons.map((c, i) => (
              <div key={i} className={i > 0 ? "pt-3 space-y-1" : "space-y-1"}>
                <p className="font-semibold text-emerald-800 uppercase text-[10px] tracking-wider">{c.category}</p>
                <p className="font-medium">{c.hedgehint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
