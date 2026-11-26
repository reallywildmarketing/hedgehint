"use client"

import { useState } from "react"
import { uploadCSVAction, ImportResponse } from "./actions"

const SAMPLE_CSV = `type,supplier,currency,amount,duedate,orderdate,paymentdate
po,Shenzhen Electronics,USD,75000,,2026-11-20,2026-12-28
invoice,Euro Stamping Ltd,EUR,32000,2026-12-15,,
po,Tokyo Optics,JPY,4500000,,2026-11-25,2027-01-10
invoice,Lagos Packaging,NGN,8500000,2026-12-20,,`

export default function ImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResponse | null>(null)

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await uploadCSVAction(formData)
      setResult(res)
    } catch (err: any) {
      setResult({
        success: false,
        totalRows: 0,
        importedPos: 0,
        importedInvoices: 0,
        errors: [{ rowNumber: 0, field: "general", message: err.message || "Failed to process import." }],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Import Purchase Orders & Invoices</h1>
        <p className="text-xs text-slate-500">
          Upload spreadsheets from your accounting system or paste CSV data directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-serif font-bold text-slate-900">Upload or Paste CSV</h2>
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Upload File (.csv)
              </label>
              <input
                type="file"
                name="file"
                accept=".csv,text/csv"
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Or Paste CSV Text
              </label>
              <textarea
                name="csvText"
                rows={9}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full font-mono text-xs border border-slate-300 rounded p-2.5 outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-amber-600 text-white text-xs font-medium py-2 hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Process CSV Import"}
            </button>
          </form>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-serif font-bold text-slate-900">Import Status & Results</h2>

          {!result ? (
            <div className="text-xs text-slate-500 space-y-2">
              <p>Supported columns in CSV:</p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
                <li>type (po or invoice)</li>
                <li>supplier (supplier / vendor name)</li>
                <li>currency (ISO 3-letter code: USD, EUR, NGN, CNY, GBP)</li>
                <li>amount (positive decimal)</li>
                <li>duedate (YYYY-MM-DD for invoices)</li>
                <li>orderdate, paymentdate (YYYY-MM-DD for POs)</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              {result.success ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs space-y-1">
                  <p className="font-bold">Import Completed Successfully!</p>
                  <p>Imported {result.importedPos} Purchase Orders and {result.importedInvoices} Invoices.</p>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                  <p className="font-bold">Import Failed with Errors</p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Row-level Validation Notices:</p>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border rounded text-[11px]">
                    {result.errors.map((e, idx) => (
                      <div key={idx} className="p-1.5 text-rose-700">
                        Row {e.rowNumber}: <span className="font-mono">{e.field}</span> &mdash; {e.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
