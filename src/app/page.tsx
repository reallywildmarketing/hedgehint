import Link from "next/link"
import { HeroSimulator } from "@/components/landing/hero-simulator"
import { MarginCalculator } from "@/components/landing/margin-calculator"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { FeatureGrid } from "@/components/landing/feature-grid"
import { WorkflowSteps } from "@/components/landing/workflow-steps"

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50/80 px-3.5 py-1 text-xs font-semibold text-amber-800 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-amber-500" />
          Autonomous FX Risk Autopilot for Importers
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-slate-900 leading-[1.15]">
          Never let a currency swing wipe out your landed margin.
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          HedgeHint reads your purchase orders and supplier invoices, forecasts exact weekly cash needs across{" "}
          <span className="font-semibold text-slate-800">USD, EUR, CNY & NGN</span>, and advises exactly when to buy currency &mdash; before rates move against you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto rounded-xl bg-amber-600 hover:bg-amber-700 px-6 py-3.5 text-white font-semibold text-sm shadow-md shadow-amber-600/20 transition-all hover:-translate-y-0.5"
          >
            Request Access & Start Hedging
          </Link>
          <Link
            href="/sign-in"
            className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3.5 text-white font-semibold text-sm transition-all"
          >
            Sign In to Workspace
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Built for finance teams paying overseas suppliers &bull; No demo records, strictly your own persisted data
        </p>
      </section>

      {/* 2. Interactive Terminal Hero Simulator */}
      <section className="max-w-5xl mx-auto">
        <HeroSimulator />
      </section>

      {/* 3. Margin Defense Interactive Dial */}
      <section className="max-w-5xl mx-auto">
        <MarginCalculator />
      </section>

      {/* 4. Comparison Section: Spreadsheets vs HedgeHint */}
      <section className="max-w-5xl mx-auto">
        <ComparisonSection />
      </section>

      {/* 5. Comprehensive Feature Grid */}
      <section className="max-w-5xl mx-auto">
        <FeatureGrid />
      </section>

      {/* 6. Four-Step Onboarding Journey */}
      <section className="max-w-5xl mx-auto">
        <WorkflowSteps />
      </section>

      {/* 7. Bottom CTA */}
      <section className="text-center max-w-2xl mx-auto space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-2xl font-serif font-bold text-slate-900">
          Ready to eliminate currency surprises?
        </h2>
        <p className="text-sm text-slate-600">
          Set up your organisation, configure your base currency, and take control of your FX exposure today.
        </p>
        <div className="pt-2">
          <Link
            href="/sign-up"
            className="inline-block rounded-xl bg-amber-600 hover:bg-amber-700 px-8 py-3.5 text-white font-semibold text-sm shadow-md transition-all hover:-translate-y-0.5"
          >
            Request Access
          </Link>
        </div>
        <p className="text-[11px] text-slate-400 pt-4">
          HedgeHint is an FX exposure risk analysis and decision platform. It does not initiate banking transfers or hold customer deposits.
        </p>
      </section>
    </div>
  )
}
