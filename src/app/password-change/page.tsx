"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { changePassword } from "./actions"

export default function PasswordChangePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError("")
    const result = await changePassword(formData)
    setLoading(false)
    if (result.ok) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Unable to change password.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-24 px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-slate-900">HedgeHint</h1>
          <p className="text-slate-600 text-sm">Set a new password</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          <p className="text-xs text-slate-500">
            Changing your password signs you out of all other sessions.
          </p>
          {error && (
            <p className="text-sm text-rose-600 text-center bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change password"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          <Link href="/sign-in" className="text-amber-600 hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
