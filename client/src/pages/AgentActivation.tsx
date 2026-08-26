import { FormEvent, useState } from "react";
import { BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";
import { startLogin } from "@/const";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AgentActivation() {
  const { user, loading } = useAuth();
  const [activationCode, setActivationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activation = trpc.accounts.agent.activate.useMutation({
    onSuccess: () => {
      setError(null);
      setActivationCode("");
      window.location.assign("/agent");
    },
    onError: failure => setError(humanizeError(failure)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    activation.mutate({ activationCode });
  };

  return <PublicShell><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
    <p className="eyebrow">AGENT ACTIVATION</p>
    <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">သင့်<br /><span className="text-lime-200">Agent အကောင့်ကို activate လုပ်ရန်</span></h1>
    <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/65">Admin ဖန်တီးထားသော invitation ရှိမှသာ activate လုပ်နိုင်သည်။ Invitation email တူညီသော Manus account ဖြင့်ဝင်ပြီး Admin ကပို့ထားသော one-time code ကိုထည့်ပါ။</p>
    <section className="golden-panel mt-10 p-6 sm:p-8">
      {loading ? <p className="text-sm text-emerald-50/65">Login status စစ်ဆေးနေသည်…</p> : !user ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">အရင်ဆုံး Manus login ဝင်ပါ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">System က လက်ရှိ Manus email သည် Admin invitation ထဲက email နှင့်ကိုက်ညီမှုကိုစစ်ဆေးမည်။</p><Button onClick={() => startLogin()} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">Manus login ဝင်ရန်</Button></div> : user.role === "agent" ? <div className="text-center"><BadgeCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Agent activate လုပ်ပြီးပါပြီ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">ဒီ account သည် Agent ဖြစ်ပြီးသားပါ။ သင့်ကိုခွင့်ပြုထားသော function များကိုကြည့်ရန် Agent console သို့သွားနိုင်သည်။</p><a href="/agent" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">Agent console သို့သွားရန်</a></div> : user.role === "admin" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Admin အတွက် activation မလိုပါ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Admin panel ရှိ Agent အကောင့်စာမျက်နှာမှ invitation ဖန်တီးပြီး activation status ကိုစီမံနိုင်သည်။</p><a href="/admin/agents" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">Agent invitation စီမံရန်</a></div> : <form onSubmit={submit}><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><div><h2 className="font-bold text-white">One-time activation code ထည့်ရန်</h2><p className="mt-1 text-sm leading-6 text-emerald-50/60">Activate လုပ်ပြီးလျှင် ဒီ Manus account သည် Agent အဖြစ်သတ်မှတ်မည်။ Code သက်တမ်းကုန်လျှင်၊ သုံးပြီးသားဖြစ်လျှင်၊ သို့မဟုတ် email မကိုက်လျှင် system ကခွင့်မပြုပါ။</p></div></div>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<div className="mt-6"><Label>Activation code</Label><Input required value={activationCode} onChange={event => setActivationCode(event.target.value.toUpperCase())} className="admin-input mt-2 font-mono tracking-[0.14em]" placeholder="SKY-XXXXXXXXXX" /></div><Button disabled={activation.isPending} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">{activation.isPending ? "စစ်ဆေးနေသည်…" : "စစ်ဆေးပြီး Agent activate လုပ်ရန်"}</Button></form>}
    </section>
  </div></PublicShell>;
}
