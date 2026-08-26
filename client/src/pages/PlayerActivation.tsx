import { useState } from "react";
import { BadgeCheck, Link2, ShieldCheck, UserRoundPlus } from "lucide-react";
import { startLogin } from "@/const";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PlayerActivation() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const inviteToken = new URLSearchParams(window.location.search).get("invite")?.trim() || null;
  const activation = trpc.accounts.player.activate.useMutation({
    onSuccess: () => { setError(null); window.location.assign("/player"); },
    onError: failure => setError(humanizeError(failure)),
  });
  return <PublicShell><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16"><p className="eyebrow">PLAYER ONBOARDING</p><h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">Agent link ဖြင့်<br /><span className="text-lime-200">Player account ဖွင့်ရန်</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/65">Player account ကို Agent ထုတ်ပေးသော invitation link မှသာဖွင့်နိုင်သည်။ ဤ flow တွင် wallet၊ payment၊ transfer သို့မဟုတ် wagering function မပါဝင်ပါ။</p><section className="golden-panel mt-10 p-6 sm:p-8">{!inviteToken ? <div className="text-center"><Link2 className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Agent invitation link လိုအပ်သည်</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Agent ထံမှရရှိသော Player link ကိုအသုံးပြုပါ။ Public page မှတစ်ဆင့် Player account ကိုတိုက်ရိုက်ဖွင့်လို့မရပါ။</p></div> : loading ? <p className="text-sm text-emerald-50/65">Login state ကိုစစ်ဆေးနေသည်…</p> : !user ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">အရင်ဆုံး Manus login ဝင်ပါ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Invitation link သည် သင့် Player profile ကို Manus login identity နှင့်ချိတ်ပေးမည်။</p><Button onClick={() => startLogin()} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">Manus login ဝင်ရန်</Button></div> : user.role === "agent" ? <div className="text-center"><BadgeCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">ဤ account သည် Agent ဖြစ်နေသည်</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Agent နှင့် Player identity ကိုခွဲထားသည်။ Agent မဟုတ်သော Manus account ဖြင့် link ကိုဖွင့်ပါ။</p></div> : user.role === "admin" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Admin account ဖြင့် Player ဖွင့်လို့မရပါ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Player အတွက် Agent invitation link နှင့် plain Manus account ကိုအသုံးပြုပါ။</p></div> : <div className="text-center"><UserRoundPlus className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Player profile ဖွင့်ရန်အတည်ပြုပါ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">ဤ link ကိုအသုံးပြုလိုက်လျှင် Player profile သည် ထုတ်ပေးသော Agent နှင့်ချိတ်ဆက်မည်။</p>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<Button disabled={activation.isPending} onClick={() => { setError(null); activation.mutate({ token: inviteToken }); }} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">{activation.isPending ? "Player account ဖွင့်နေသည်…" : "Player account ဖွင့်ရန်"}</Button></div>}</section></div></PublicShell>;
}
