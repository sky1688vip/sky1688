import { Copy, Link2, ShieldAlert, UserPlus, UserRoundX } from "lucide-react";
import { useState } from "react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
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
type CopyTarget = "activation-link" | "activation-code" | null;

const blankAgent = (): AgentForm => ({ fullName: "", email: "", phone: "" });

export default function AdminAgents() {
  const { user, loading } = useAuth();
  const canQueryAdmin = !loading && user?.role === "admin";
  const utils = trpc.useUtils();
  const agents = trpc.adminAgents.list.useQuery(undefined, { enabled: canQueryAdmin });
  const [form, setForm] = useState<AgentForm>(blankAgent);
  const [error, setError] = useState<string | null>(null);
  const [copyTarget, setCopyTarget] = useState<CopyTarget>(null);
  const [issued, setIssued] = useState<{ fullName: string; agentCode: string; activationCode: string; activationExpiresAt: Date } | null>(null);
  const activationUrl = typeof window === "undefined" ? "/agent/activate" : getAgentActivationUrl(window.location.origin);

  const create = trpc.adminAgents.create.useMutation({
    onSuccess: result => {
      setIssued({ fullName: form.fullName, ...result });
      setForm(blankAgent());
      setError(null);
      setCopyTarget(null);
      utils.adminAgents.list.invalidate();
    },
    onError: failure => setError(humanizeError(failure)),
  });

  const suspend = trpc.adminAgents.suspend.useMutation({
    onSuccess: () => {
      setError(null);
      utils.adminAgents.list.invalidate();
    },
    onError: failure => setError(humanizeError(failure)),
  });

  const copyToClipboard = async (value: string, target: Exclude<CopyTarget, null>) => {
    await navigator.clipboard.writeText(value);
    setCopyTarget(target);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIssued(null);
    setCopyTarget(null);
    create.mutate({ fullName: form.fullName, email: form.email, phone: form.phone || undefined });
  };

  return <AdminShell>
    <AdminPageHeader
      eyebrow="AGENT PROVISIONING"
      title="Agent အကောင့်စီမံခန့်ခွဲမှု"
      description="Admin တစ်ဦးတည်းသာ Agent invitation ဖန်တီးနိုင်သည်။ Agent သည် invitation email တူညီသော Manus account ဖြင့် ဝင်ပြီး one-time activation code ကိုသုံးရမည်။"
    />

    <section className="admin-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">Agent activation link</h2>
          <p className="mt-1 text-sm leading-6 text-emerald-50/65">Agent တိုင်းကို ဒီ link ကိုပို့ပါ။ Link တစ်ခုတည်းဖြင့် account မဖွင့်နိုင်ပါ—Agent ၏ email တူညီမှုနှင့် one-time code ကို server က ထပ်စစ်ဆေးမည်။</p>
        </div>
        <Link2 className="h-5 w-5 shrink-0 text-lime-200" />
      </div>
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <code className="min-w-0 flex-1 break-all border border-lime-200/35 bg-[#071a16] px-4 py-3 font-mono text-sm text-lime-100">{activationUrl}</code>
        <Button size="sm" variant="outline" onClick={() => copyToClipboard(activationUrl, "activation-link")} className="admin-action shrink-0">
          <Copy className="mr-1.5 h-3.5 w-3.5" />{copyTarget === "activation-link" ? "Link ကူးပြီးပါပြီ" : "Link ကူးရန်"}
        </Button>
      </div>
      <p className="mt-4 text-sm leading-6 text-emerald-50/60"><strong className="text-emerald-50">ပို့ပေးရန် အဆင့်များ — </strong>(1) အထက်က link ကိုပို့ပါ။ (2) invitation ဖန်တီးပြီးနောက် ပေါ်လာသော one-time code ကို လုံခြုံသော channel ဖြင့်ပို့ပါ။ (3) Agent သည် invitation email တူညီသော Manus account ဖြင့်ဝင်ပြီး code ထည့်ရမည်။</p>
    </section>

    <section className="admin-card mt-7 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">Agent invitation ဖန်တီးရန်</h2>
          <p className="mt-1 text-sm text-emerald-50/55">System က activation code ကိုအလိုအလျောက်မပို့ပါ။ ဖန်တီးပြီးလျှင် Admin က သတ်မှတ်ထားသော Agent ထံသို့သာ လုံခြုံစွာပို့ပေးရမည်။</p>
        </div>
        <UserPlus className="h-5 w-5 text-lime-200" />
      </div>
      {error ? <p className="mt-4 rounded-lg border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}
      <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-3">
        <div><Label>Agent အမည်</Label><Input required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} className="admin-input mt-2" placeholder="ဥပမာ — Aung Min" /></div>
        <div><Label>Manus login email</Label><Input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="admin-input mt-2" placeholder="agent@example.com" /></div>
        <div><Label>ဆက်သွယ်ရန်ဖုန်း (မဖြည့်လည်းရ)</Label><Input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="admin-input mt-2" placeholder="0912345678" /></div>
        <div className="md:col-span-3"><Button disabled={create.isPending} className="bg-lime-200 text-[#09221c] hover:bg-lime-100">{create.isPending ? "ဖန်တီးနေသည်…" : "Invitation ဖန်တီးပြီး activation code ထုတ်ရန်"}</Button></div>
      </form>
    </section>

    {issued ? <section className="mt-7 border border-lime-200/35 bg-lime-200/10 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" />
        <div>
          <h2 className="font-bold text-white">{issued.fullName} အတွက် one-time activation information</h2>
          <p className="mt-1 text-sm leading-6 text-emerald-50/70">ဒီ code ကို ယခု Admin session တွင်သာပြမည်။ အထက်ပါ activation link နှင့် code ကို invitation email တူညီသော Manus user ထံ လုံခြုံစွာပို့ပါ။ Code သက်တမ်းကုန်ချိန် — {formatDate(issued.activationExpiresAt)}။</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="border border-lime-200/35 bg-[#071a16] px-4 py-2 font-mono text-base font-bold tracking-[.12em] text-lime-100">{issued.activationCode}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(issued.activationCode, "activation-code")} className="admin-action"><Copy className="mr-1.5 h-3.5 w-3.5" />{copyTarget === "activation-code" ? "Code ကူးပြီးပါပြီ" : "Code ကူးရန်"}</Button>
            <span className="text-sm text-emerald-50/55">Agent code: <strong className="text-white">{issued.agentCode}</strong></span>
          </div>
        </div>
      </div>
    </section> : null}

    <section className="mt-7">
      {agents.isLoading ? <QueryLoading /> : agents.isError ? <QueryError label="Agent စာရင်းကို မဖတ်နိုင်သေးပါ။" onRetry={() => agents.refetch()} /> : !agents.data?.length ? <QueryEmpty label="Agent invitation မဖန်တီးရသေးပါ" detail="အပေါ်က form ဖြင့် ပထမ Agent ကိုဖန်တီးပါ။ Activate မလုပ်ရသေးသော account သည် Agent permission မရပါ။" /> : <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[1.1fr_1fr_.8fr_.8fr_1fr] gap-3 bg-white/[0.045] px-5 py-3 text-xs font-bold uppercase tracking-wider text-emerald-50/45"><span>Agent</span><span>Email / Code</span><span>အခြေအနေ</span><span>ဖန်တီးသည့်အချိန်</span><span>လုပ်ဆောင်ချက်</span></div>
        {agents.data.map(({ agent, activatedUserName }) => <div key={agent.id} className="grid grid-cols-1 gap-4 border-t border-white/8 px-5 py-5 text-sm md:grid-cols-[1.1fr_1fr_.8fr_.8fr_1fr] md:items-center">
          <div><p className="font-bold text-white">{agent.fullName}</p><p className="mt-1 text-xs text-emerald-50/50">{activatedUserName ? `ချိတ်ဆက်ပြီး — ${activatedUserName}` : "Manus activation စောင့်ဆိုင်းနေသည်"}</p></div>
          <div><p className="text-emerald-50/75">{agent.email}</p><p className="mt-1 font-mono text-xs tracking-[0.1em] text-lime-100">{agent.agentCode}</p></div>
          <p><span className={`status-pill status-${agent.status === "active" ? "published" : agent.status === "invited" ? "draft" : "archived"}`}>{agent.status === "active" ? "Activate လုပ်ပြီး" : agent.status === "invited" ? "Activate စောင့်ဆိုင်း" : "ရပ်ဆိုင်းထားသည်"}</span></p>
          <p className="text-emerald-50/60">{formatDate(agent.createdAt)}</p>
          <div>{agent.status !== "suspended" ? <Button size="sm" variant="outline" disabled={suspend.isPending} onClick={() => suspend.mutate({ id: agent.id })} className="admin-action"><UserRoundX className="mr-1.5 h-3.5 w-3.5" />ရပ်ဆိုင်းရန်</Button> : <span className="text-xs text-emerald-50/40">တိုက်ရိုက်ပြန်ဖွင့်မရပါ</span>}</div>
        </div>)}
      </div>}
    </section>
  </AdminShell>;
}
