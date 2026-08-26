import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AgentPassword() {
  const { user, loading } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const change = trpc.accounts.agent.changePassword.useMutation({ onSuccess: () => window.location.assign("/agent"), onError: failure => setError(humanizeError(failure)) });
  const submit = (event: FormEvent) => { event.preventDefault(); if (newPassword !== confirmPassword) { setError("Password နှစ်ကြိမ်ရိုက်ထားသည် မတူညီပါ။"); return; } setError(null); change.mutate({ newPassword }); };
  return <PublicShell><div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16"><p className="eyebrow">SECURITY SETUP</p><h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white">Password အသစ်<br /><span className="text-lime-200">သတ်မှတ်ရန်</span></h1><section className="golden-panel mt-10 p-6 sm:p-8">{loading ? <p className="text-sm text-emerald-50/65">Login status စစ်ဆေးနေသည်…</p> : user?.role !== "agent" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Agent login လိုအပ်သည်</h2><a href="/agent/login" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">Agent login သို့သွားရန်</a></div> : <form onSubmit={submit}><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><p className="text-sm leading-6 text-emerald-50/65">Admin ထုတ်ပေးသော temporary password ကို ဆက်မသုံးပါနှင့်။ အနည်းဆုံး 12 characters ရှိသော password အသစ်ကို သတ်မှတ်ပါ။</p></div>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<div className="mt-6"><Label>Password အသစ်</Label><Input required type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="admin-input mt-2" autoComplete="new-password" /></div><div className="mt-5"><Label>Password အသစ် ထပ်ရိုက်ရန်</Label><Input required type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="admin-input mt-2" autoComplete="new-password" /></div><Button disabled={change.isPending} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">{change.isPending ? "သိမ်းနေသည်…" : "Password သိမ်းပြီး Agent console သို့သွားရန်"}</Button></form>}</section></div></PublicShell>;
}
