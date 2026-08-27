import { useState } from "react";
import { KeyRound, Link2, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";

export default function PlayerActivation() {
  const [playerCode, setPlayerCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const inviteToken = new URLSearchParams(window.location.search).get("invite")?.trim() || null;
  const activation = trpc.accounts.player.activate.useMutation({
    onSuccess: () => { setError(null); setPassword(""); setActivated(true); },
    onError: failure => setError(humanizeError(failure)),
  });

  return <PublicShell><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16"><p className="eyebrow">PLAYER ACTIVATION</p><h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">Agent ပေးသော link ဖြင့်<br /><span className="text-lime-200">Player account ဝင်ရန်</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/65">Agent ပေးသော Player invitation link၊ Player ID နှင့် initial password သုံးခုလုံးလိုအပ်သည်။ Manus account သို့မဟုတ် Manus login မလိုအပ်ပါ။</p><section className="golden-panel mt-10 p-6 sm:p-8">{activated ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Player account ဖွင့်ပြီးပါပြီ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">လုံခြုံသော Player session ကိုသိမ်းဆည်းပြီးပါပြီ။ ဆက်လက်ဝင်ရောက်ရန်ခလုတ်ကိုနှိပ်ပါ။</p><Button onClick={() => window.location.assign("/player")} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">Player Home သို့ဆက်ရန်</Button></div> : !inviteToken ? <div className="text-center"><Link2 className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Agent invitation link လိုအပ်သည်</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Player account ကို public page မှတိုက်ရိုက်ဖွင့်မရပါ။ Agent ပေးသော Player link ကိုသာအသုံးပြုပါ။</p></div> : <form onSubmit={event => { event.preventDefault(); setError(null); activation.mutate({ token: inviteToken, playerCode, password }); }}><div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Player ID နှင့် password ဖြင့်ဝင်ပါ</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Agent မှပေးထားသော Player ID နှင့် initial password ကိုထည့်ပါ။ ပထမဝင်ရောက်ပြီးနောက် password အသစ်ပြောင်းခိုင်းမည်။</p></div><div className="mt-7 grid gap-5"><div className="grid gap-2"><Label htmlFor="player-code" className="text-emerald-50/80">Player ID</Label><Input id="player-code" value={playerCode} onChange={event => setPlayerCode(event.target.value)} autoComplete="username" placeholder="PL-XXXXXXXX" required className="border-white/15 bg-white/[.05] text-white" /></div><div className="grid gap-2"><Label htmlFor="player-password" className="text-emerald-50/80">Initial password</Label><Input id="player-password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required className="border-white/15 bg-white/[.05] text-white" /></div></div>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<Button type="submit" disabled={activation.isPending} className="mt-6 w-full bg-lime-200 text-[#09221c] hover:bg-lime-100"><KeyRound className="mr-2 h-4 w-4" />{activation.isPending ? "Player account ဖွင့်နေသည်…" : "Player account ဝင်ရန်"}</Button></form>}</section></div></PublicShell>;
}
