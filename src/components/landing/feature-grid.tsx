export function FeatureGrid() {
  const features = [
    {
      title: "The Weekly Exposure Ribbon",
      description: "Visualizes future foreign currency obligations by calendar week, highlighting upcoming cash flow crunches before they happen.",
      badge: "Cash Flow Visibility",
    },
    {
      title: "Autopilot Buy Recommendations",
      description: "Mathematical timing models compare spot prices to 30-day moving averages, advising how much to hedge now vs. later.",
      badge: "Decision Engine",
    },
    {
      title: "Dynamic Rate Alert Sentinels",
      description: "Continuous evaluation triggers alerts when currency pairs break through target buy prices or cross risk thresholds.",
      badge: "Market Monitoring",
    },
    {
      title: "4-Eye Approval Workflow",
      description: "Cryptographically bound separation of duties: requesters can never approve their own orders. Finance managers hold the keys.",
      badge: "Internal Governance",
    },
    {
      title: "Realised Savings & Variance Audits",
      description: "Compares achieved FX rates with spot rates at execution time, compiling monthly board reports on currency gains, losses, and savings.",
      badge: "Executive Reporting",
    },
    {
      title: "Enterprise Tenant Isolation",
      description: "Row-level database tenancy, private encrypted object storage for invoices, and tamper-evident append-only audit events.",
      badge: "Security & Compliance",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded">
          Core Capabilities
        </span>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Everything an importer needs to defend cash margins
        </h2>
        <p className="text-slate-600 text-sm">
          A dedicated risk platform purpose-built for finance teams managing international suppliers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {f.badge}
              </span>
              <h3 className="font-serif font-bold text-base text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
            </div>
            <div className="pt-2 text-[11px] text-amber-700 font-semibold">
              Included in core platform &rarr;
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
