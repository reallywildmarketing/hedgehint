export function WorkflowSteps() {
  const steps = [
    {
      num: "01. INGEST",
      title: "Upload Spreadsheets",
      desc: "Drop purchase orders or supplier invoices. Automatic validation flags malformed currencies or dates.",
    },
    {
      num: "02. MAP",
      title: "Weekly Cash Timeline",
      desc: "HedgeHint maps obligations into calendar weeks, displaying the signature Exposure Ribbon.",
    },
    {
      num: "03. ADVISE",
      title: "Autopilot Guidance",
      desc: "Mathematical models compare spot rates to 30-day benchmarks, advising how much to lock now vs. hold.",
    },
    {
      num: "04. APPROVE",
      title: "4-Eye Governance",
      desc: "Finance managers approve orders with enforced separation of duties. Record buys to audit realised savings.",
    },
  ]

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
          Rapid Deployment
        </span>
        <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
          From invoice import to protected margin in 4 steps
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        {steps.map((s, idx) => (
          <div key={idx} className="space-y-2 border-l border-slate-800 pl-4">
            <span className="font-mono text-amber-400 font-bold text-sm">{s.num}</span>
            <h4 className="font-bold text-sm text-slate-100">{s.title}</h4>
            <p className="text-slate-400 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
