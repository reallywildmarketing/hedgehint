"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn as signInAction } from "./actions"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const result = await signInAction(email, password)
    setLoading(false)
    if (result.ok) {
      if (result.mustChangePassword) {
        router.push("/password-change")
      } else {
        router.push(redirect)
        router.refresh()
      }
    } else {
      // Never reveal whether the email exists.
      setError("Invalid email or password.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-24 px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-slate-900">HedgeHint</h1>
          <p className="text-slate-600 text-sm">Sign in to your organisation</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-600 text-center bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          Don't have access yet?{" "}
          <Link href="/sign-up" className="text-amber-600 hover:underline font-medium">
            Request access
          </Link>
        </p>
      </div>
    </div>
  )
}
