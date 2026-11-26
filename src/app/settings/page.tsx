import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { updateOrgSettings, approveUserAction } from "./actions"

export default async function SettingsPage() {
  const auth = await getAuthSession()
  if (!auth?.user || !auth.organisation) redirect("/sign-in")
  if (auth.user.role !== "admin") redirect("/dashboard")

  const org = auth.organisation

  const [members, pendingUsers, auditEvents] = await Promise.all([
    prisma.organisationMember.findMany({
      where: { organisationId: org.id },
      include: { user: true },
    }),
    prisma.user.findMany({ where: { role: "pending" } }),
    prisma.auditEvent.findMany({
      where: { organisationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { auditActor: true },
    }),
  ])

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Settings & Administration</h1>
        <p className="text-xs text-slate-500">Configure parameters, approve members, and inspect the audit trail.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-serif font-bold text-slate-900">Organisation Parameters</h2>
          <form action={updateOrgSettings} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Name</label>
              <input name="name" defaultValue={org.name} required className="w-full border rounded p-1.5" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Base Currency</label>
              <input name="baseCurrency" defaultValue={org.baseCurrency} required className="w-full font-mono uppercase border rounded p-1.5" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Risk Appetite</label>
              <select name="riskAppetite" defaultValue={org.riskAppetite} className="w-full border rounded p-1.5 bg-white">
                <option value="low">Low (Conservative)</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" className="rounded bg-slate-900 text-white font-medium py-1.5 px-4">Save</button>
          </form>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-serif font-bold text-slate-900">Pending Access Requests</h2>
          {pendingUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No pending sign-up requests.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {pendingUsers.map((u) => (
                <div key={u.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{u.name || "Unnamed"}</span>
                    <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <form action={approveUserAction.bind(null, u.id, "officer")}>
                      <button className="rounded bg-amber-600 text-white text-[10px] px-2 py-0.5">Officer</button>
                    </form>
                    <form action={approveUserAction.bind(null, u.id, "manager")}>
                      <button className="rounded bg-slate-900 text-white text-[10px] px-2 py-0.5">Manager</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-serif font-bold text-slate-900">Audit Trail (Append-Only)</h2>
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b text-slate-500 font-sans">
              <th className="py-1">Timestamp</th>
              <th className="py-1">Action</th>
              <th className="py-1">User</th>
              <th className="py-1">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditEvents.map((e) => (
              <tr key={e.id}>
                <td className="py-1 text-slate-400">{new Date(e.createdAt).toLocaleTimeString()}</td>
                <td className="py-1 font-bold text-slate-800">{e.action}</td>
                <td className="py-1 text-slate-600">{e.auditActor?.email || "System"}</td>
                <td className="py-1 text-slate-500">{e.entityType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
