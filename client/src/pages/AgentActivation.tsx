import { FormEvent, useState } from "react";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AgentActivation() {
  const { user, loading } = useAuth();
  const [agentCode, setAgentCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = trpc.accounts.agent.login.useMutation({
    onSuccess: result => window.location.assign(result.mustChangePassword ? "/agent/password" : "/agent"),
    onError: failure => setError(humanizeError(failure)),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(null); login.mutate({ agentCode, password }); };
  return <PublicShell><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16"><p className="eyebrow">AGENT LOGIN</p><h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">SKY1688<br /><span className="text-lime-200">Agent login</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/65">Manus account မလိုပါ။ Admin ကပို့ထားသော Agent ID နှင့် temporary password ဖြင့်ဝင်ပါ။ ပထမဝင်ရောက်ပြီးနောက် password အသစ်ပြောင်းရန်လိုအပ်သည်။</p><section className="golden-panel mt-10 p-6 sm:p-8">{loading ? <p className="text-sm text-emerald-50/65">Login status စစ်ဆေးနေသည်…</p> : user?.role === "agent" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Agent login ဝင်ပြီးပါပြီ</h2><a href="/agent" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">Agent console သို့သွားရန်</a></div> : user?.role === "admin" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Admin account ကိုအသုံးပြုနေသည်</h2><a href="/admin/agents" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">Agent account စီမံရန်</a></div> : <form onSubmit={submit}><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><div><h2 className="font-bold text-white">Agent credential ထည့်ရန်</h2><p className="mt-1 text-sm leading-6 text-emerald-50/60">Admin ကထုတ်ပေးသော Agent ID နှင့် temporary password ကိုထည့်ပါ။ Failed attempts များလျှင် security lock ချမည်။</p></div></div>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<div className="mt-6"><Label>Agent ID</Label><Input required value={agentCode} onChange={event => setAgentCode(event.target.value.toUpperCase())} className="admin-input mt-2 font-mono tracking-[0.12em]" placeholder="AG-XXXXXXXX" /></div><div className="mt-5"><Label>Temporary password</Label><Input required type="password" value={password} onChange={event => setPassword(event.target.value)} className="admin-input mt-2 font-mono" autoComplete="current-password" /></div><Button disabled={login.isPending} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100"><LogIn className="mr-2 h-4 w-4" />{login.isPending ? "ဝင်ရောက်နေသည်…" : "Agent login ဝင်ရန်"}</Button></form>}</section></div></PublicShell>;
}
