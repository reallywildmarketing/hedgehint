import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { signOut } from "@/lib/auth"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "HedgeHint — FX exposure autopilot for importers",
  description:
    "Manage exchange-rate risk on supplier payments. Exposure, rates, hedging recommendations and approvals in one place.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getAuthSession()

  return (
    <html lang="en">
      <body className="flex flex-col bg-slate-50 text-slate-900 antialiased min-h-screen">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3">
            <Link href="/" className="font-serif font-semibold text-slate-900 text-lg">
              HedgeHint
            </Link>
            <div className="flex items-center gap-4">
              {auth ? (
                <>
                  <span className="text-sm text-slate-600">{auth.user.email}</span>
                  <form action={signOut} method="POST" className="inline">
                    <button
                      className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 focus:outline-none"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white text-sm font-medium"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        {auth ? (
          <nav className="border-b border-slate-200 bg-white">
            <div className="px-6 py-2 flex gap-2 overflow-x-auto">
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900">
                Dashboard
              </Link>
              <Link href="/exposure" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Exposure
              </Link>
              <Link href="/rates" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Rates
              </Link>
              <Link href="/requests" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Hedge requests
              </Link>
              <Link href="/alerts" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Alerts
              </Link>
              <Link href="/import" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Import
              </Link>
              <Link href="/reports" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Reports
              </Link>
              {auth.user.role === "admin" && (
                <Link href="/settings" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Settings
                </Link>
              )}
            </div>
          </nav>
        ) : null}

        <main className="flex-1 px-6 pb-12 max-w-5xl mx-auto w-full">{children}</main>
      </body>
    </html>
  )
}
