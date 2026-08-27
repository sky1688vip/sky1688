import { Copy, KeyRound, Link2, RotateCcw, ShieldAlert, UserPlus, UserRoundX } from "lucide-react";
import { useState } from "react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminUnitIssuancePanel } from "@/components/AdminUnitIssuancePanel";
import { AdminShell } from "@/components/AdminShell";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { getAgentActivationUrl } from "@/lib/agentActivation";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type AgentForm = { fullName: string; email: string; phone: string };
type CredentialIssue = { fullName: string; agentCode: string; temporaryPassword: string; temporaryPasswordExpiresAt: Date };
type CopyTarget = "login-link" | "password" | null;
const blankAgent = (): AgentForm => ({ fullName: "", email: "", phone: "" });

export default function AdminAgents() {
  const { user, loading } = useAuth();
  const canQueryAdmin = !loading && user?.role === "admin";
  const utils = trpc.useUtils();
  const agents = trpc.adminAgents.list.useQuery(undefined, { enabled: canQueryAdmin });
  const unitAgentBalances = trpc.units.admin.agentBalances.useQuery(undefined, { enabled: canQueryAdmin });
  const unitHistory = trpc.units.admin.history.useQuery(undefined, { enabled: canQueryAdmin });
  const [form, setForm] = useState<AgentForm>(blankAgent);
  const [error, setError] = useState<string | null>(null);
  const [copyTarget, setCopyTarget] = useState<CopyTarget>(null);
  const [issued, setIssued] = useState<CredentialIssue | null>(null);
  const loginUrl = typeof window === "undefined" ? "/agent/login" : getAgentActivationUrl(window.location.origin);

  const create = trpc.adminAgents.create.useMutation({
    onSuccess: result => {
      setIssued({ fullName: form.fullName, ...result });
      setForm(blankAgent()); setError(null); setCopyTarget(null); utils.adminAgents.list.invalidate();
    },
    onError: failure => setError(humanizeError(failure)),
  });
  const reset = trpc.adminAgents.resetCredentials.useMutation({
    onSuccess: result => { setIssued({ fullName: "Agent", ...result }); setError(null); setCopyTarget(null); utils.adminAgents.list.invalidate(); },
    onError: failure => setError(humanizeError(failure)),
  });
  const suspend = trpc.adminAgents.suspend.useMutation({
    onSuccess: () => { setError(null); utils.adminAgents.list.invalidate(); },
    onError: failure => setError(humanizeError(failure)),
  });
  const issueUnits = trpc.units.admin.issueToAgent.useMutation({
    onSuccess: async () => {
      setError(null);
      await Promise.all([unitAgentBalances.refetch(), unitHistory.refetch()]);
    },
  });
  const copy = async (value: string, target: Exclude<CopyTarget, null>) => { await navigator.clipboard.writeText(value); setCopyTarget(target); };
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(null); setIssued(null); create.mutate({ fullName: form.fullName, email: form.email || undefined, phone: form.phone || undefined }); };

  return <AdminShell><AdminPageHeader eyebrow="AGENT PROVISIONING" title="Agent အကောင့်စီမံခန့်ခွဲမှု" description="Admin တစ်ဦးတည်းသာ Agent ID နှင့် temporary password ထုတ်ပေးနိုင်သည်။ Agent သည် Manus account မလိုဘဲ SKY1688 Agent login ဖြင့်ဝင်နိုင်သည်။" />
    <section className="admin-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-white">Agent login link</h2><p className="mt-1 text-sm leading-6 text-emerald-50/65">Agent တိုင်းကို ဒီ link ပို့ပါ။ Agent ID နှင့် temporary password ကို link နှင့်ခွဲ၍ လုံခြုံသော channel ဖြင့်ပို့ရမည်။</p></div><Link2 className="h-5 w-5 shrink-0 text-lime-200" /></div><div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center"><code className="min-w-0 flex-1 break-all border border-lime-200/35 bg-[#071a16] px-4 py-3 font-mono text-sm text-lime-100">{loginUrl}</code><Button size="sm" variant="outline" onClick={() => copy(loginUrl, "login-link")} className="admin-action shrink-0"><Copy className="mr-1.5 h-3.5 w-3.5" />{copyTarget === "login-link" ? "Link ကူးပြီးပါပြီ" : "Link ကူးရန်"}</Button></div><p className="mt-4 text-sm leading-6 text-emerald-50/60"><strong className="text-emerald-50">ပို့ပေးရန် အဆင့်များ — </strong>(1) Link ကိုပို့ပါ။ (2) Agent ID နှင့် temporary password ကိုသီးခြားလုံခြုံသော channel ဖြင့်ပို့ပါ။ (3) Agent က ပထမဝင်ရောက်ပြီးနောက် password အသစ်ပြောင်းရမည်။</p></section>
    <section className="admin-card mt-7 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-white">Agent account ဖန်တီးရန်</h2><p className="mt-1 text-sm text-emerald-50/55">Email သည် contact record အတွက်သာဖြစ်ပြီး login identity မဟုတ်ပါ။ Admin ကထုတ်ပေးသော Agent ID နှင့် password ဖြင့်သာ Agent ဝင်မည်။</p></div><UserPlus className="h-5 w-5 text-lime-200" /></div>{error ? <p className="mt-4 rounded-lg border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-3"><div><Label>Agent အမည်</Label><Input required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} className="admin-input mt-2" placeholder="ဥပမာ — Aung Min" /></div><div><Label>ဆက်သွယ်ရန် email (မဖြည့်လည်းရ)</Label><Input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="admin-input mt-2" placeholder="agent@example.com" /></div><div><Label>ဆက်သွယ်ရန်ဖုန်း (မဖြည့်လည်းရ)</Label><Input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="admin-input mt-2" placeholder="0912345678" /></div><div className="md:col-span-3"><Button disabled={create.isPending} className="bg-lime-200 text-[#09221c] hover:bg-lime-100">{create.isPending ? "ဖန်တီးနေသည်…" : "Agent ID နှင့် temporary password ထုတ်ရန်"}</Button></div></form></section>
    {issued ? <section className="mt-7 border border-lime-200/35 bg-lime-200/10 p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><div><h2 className="font-bold text-white">{issued.fullName} အတွက် Agent login credentials</h2><p className="mt-1 text-sm leading-6 text-emerald-50/70">Temporary password ကို ယခု Admin session တွင်သာပြမည်။ Agent ထံသို့ Agent ID နှင့် password ကို လုံခြုံစွာပို့ပါ။ ပထမဝင်ရောက်ပြီးနောက် password အသစ်ပြောင်းရန်လိုအပ်ပြီး သက်တမ်းကုန်ချိန်မှာ {formatDate(issued.temporaryPasswordExpiresAt)} ဖြစ်သည်။</p><div className="mt-4 flex flex-wrap items-center gap-3"><span className="border border-lime-200/35 bg-[#071a16] px-4 py-2 font-mono text-sm text-lime-100">Agent ID: <strong>{issued.agentCode}</strong></span><code className="border border-lime-200/35 bg-[#071a16] px-4 py-2 font-mono text-base font-bold tracking-[.08em] text-lime-100">{issued.temporaryPassword}</code><Button size="sm" variant="outline" onClick={() => copy(issued.temporaryPassword, "password")} className="admin-action"><Copy className="mr-1.5 h-3.5 w-3.5" />{copyTarget === "password" ? "Password ကူးပြီးပါပြီ" : "Password ကူးရန်"}</Button></div></div></div></section> : null}
    <section className="mt-7">{agents.isLoading ? <QueryLoading /> : agents.isError ? <QueryError label="Agent စာရင်းကို မဖတ်နိုင်သေးပါ။" onRetry={() => agents.refetch()} /> : !agents.data?.length ? <QueryEmpty label="Agent account မဖန်တီးရသေးပါ" detail="အပေါ်က form ဖြင့် Agent ID နှင့် temporary password ကိုထုတ်ပါ။" /> : <div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1.1fr_1fr_.8fr_.8fr_1fr] gap-3 bg-white/[0.045] px-5 py-3 text-xs font-bold uppercase tracking-wider text-emerald-50/45"><span>Agent</span><span>Contact / Agent ID</span><span>အခြေအနေ</span><span>ဖန်တီးသည့်အချိန်</span><span>လုပ်ဆောင်ချက်</span></div>{agents.data.map(({ agent }) => <div key={agent.id} className="grid grid-cols-1 gap-4 border-t border-white/8 px-5 py-5 text-sm md:grid-cols-[1.1fr_1fr_.8fr_.8fr_1fr] md:items-center"><div><p className="font-bold text-white">{agent.fullName}</p><p className="mt-1 text-xs text-emerald-50/50">{agent.email ?? "Contact email မရှိ"}</p></div><div><p className="font-mono text-xs tracking-[0.1em] text-lime-100">{agent.agentCode}</p></div><p><span className={`status-pill status-${agent.status === "active" ? "published" : agent.status === "invited" ? "draft" : "archived"}`}>{agent.status === "active" ? "အသုံးပြုနေသည်" : agent.status === "invited" ? "ပထမ login စောင့်ဆိုင်း" : "ရပ်ဆိုင်းထားသည်"}</span></p><p className="text-emerald-50/60">{formatDate(agent.createdAt)}</p><div className="flex flex-wrap gap-2">{agent.status !== "suspended" ? <><Button size="sm" variant="outline" disabled={reset.isPending} onClick={() => reset.mutate({ id: agent.id })} className="admin-action"><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Password ပြန်ထုတ်ရန်</Button><Button size="sm" variant="outline" disabled={suspend.isPending} onClick={() => suspend.mutate({ id: agent.id })} className="admin-action"><UserRoundX className="mr-1.5 h-3.5 w-3.5" />ရပ်ဆိုင်းရန်</Button></> : <span className="text-xs text-emerald-50/40">တိုက်ရိုက်ပြန်ဖွင့်မရပါ</span>}</div></div>)}</div>}</section>
    <AdminUnitIssuancePanel
      agents={unitAgentBalances.data}
      history={unitHistory.data}
      isLoading={unitAgentBalances.isLoading || unitHistory.isLoading}
      error={unitAgentBalances.isError ? humanizeError(unitAgentBalances.error) : unitHistory.isError ? humanizeError(unitHistory.error) : null}
      onRetry={() => { void unitAgentBalances.refetch(); void unitHistory.refetch(); }}
      onIssue={input => issueUnits.mutate(input)}
      isIssuing={issueUnits.isPending}
      issueError={issueUnits.isError ? humanizeError(issueUnits.error) : null}
    />
  </AdminShell>;
}
