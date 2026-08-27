import { useMemo, useState, type FormEvent } from "react";
import { ArrowDownToLine, History, Send, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UnitTransaction = {
  id: number;
  transactionType: "admin_issue" | "agent_transfer" | "agent_adjustment_credit" | "agent_adjustment_debit";
  amount: number;
  fromOwnerType: "system" | "agent" | "player";
  fromOwnerId: number | null;
  toOwnerType: "agent" | "player";
  toOwnerId: number;
  createdAt: Date;
  note: string | null;
};

export type AgentUnitOverview = {
  availableUnits: number;
  players: Array<{
    id: number;
    playerCode: string | null;
    phone: string | null;
    status: "invited" | "active" | "suspended";
    availableUnits: number | null;
  }>;
  transactions: UnitTransaction[];
};

export function AgentUnitPanel({ overview, isLoading, error, onRetry, onTransfer, isTransferring, transferError }: {
  overview: AgentUnitOverview | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onTransfer: (input: { playerProfileId: number; amount: number; note?: string }) => void;
  isTransferring: boolean;
  transferError: string | null;
}) {
  const [playerProfileId, setPlayerProfileId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const activePlayers = useMemo(() => overview?.players.filter(player => player.status === "active") ?? [], [overview]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onTransfer({ playerProfileId: Number(playerProfileId), amount: Number(amount), note: note.trim() || undefined });
  };

  if (isLoading) return <section className="border border-[#d8e3f6] bg-white p-7 text-sm text-slate-600">Unit လက်ကျန်ကိုဖတ်နေသည်…</section>;
  if (error) return <section className="border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-700">{error}</p><Button className="mt-4" variant="outline" onClick={onRetry}>ပြန်စမ်းရန်</Button></section>;

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#4476bf]">Unit control</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Player ကို Unit ဖြည့်ရန်</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Admin မှဖြည့်ပေးထားသော Unit လက်ကျန်အတွင်းမှ ကိုယ့် Player များထံသာ ဖြည့်နိုင်သည်။ Transaction တစ်ခုစီကို audit ledger တွင်မှတ်တမ်းတင်ထားသည်။</p></div>
      <div className="min-w-48 border border-[#9ebce8] bg-white p-4 shadow-[0_3px_10px_rgba(47,101,184,0.08)]"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Available Units</p><p className="mt-2 text-3xl font-black text-[#1e5fb8]">{overview?.availableUnits ?? 0}</p></div>
    </div>

    <section className="mt-6 max-w-3xl border border-[#d8e3f6] bg-white p-5 shadow-[0_6px_20px_rgba(47,101,184,0.06)] sm:p-7">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4ff] text-[#3979de]"><Send className="h-5 w-5" /></div><div><h3 className="font-black text-slate-950">Player Unit ဖြည့်ရန်</h3><p className="mt-1 text-sm text-slate-600">Available Units ထက်မပိုနိုင်ပါ။ Active Player ကိုသာရွေးနိုင်သည်။</p></div></div>
      {transferError ? <p className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{transferError}</p> : null}
      {activePlayers.length ? <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2"><div><Label>Player</Label><select value={playerProfileId} onChange={event => setPlayerProfileId(event.target.value)} required className="mt-2 h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#3979de]"><option value="" disabled>Player ကိုရွေးပါ</option>{activePlayers.map(player => <option key={player.id} value={player.id}>{player.playerCode ?? `Player #${player.id}`} · လက်ကျန် {player.availableUnits ?? 0} Unit</option>)}</select></div><div><Label>ဖြည့်မည့် Unit</Label><Input className="mt-2" type="number" min="1" max="1000000" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} required /></div><div className="sm:col-span-2"><Label>မှတ်ချက် (မဖြည့်လည်းရ)</Label><Input className="mt-2" maxLength={240} value={note} onChange={event => setNote(event.target.value)} placeholder="ဥပမာ — Player request" /></div><div className="sm:col-span-2"><Button type="submit" disabled={isTransferring} className="bg-[#3979de] text-white hover:bg-[#2465c8]"><ArrowDownToLine className="mr-2 h-4 w-4" />{isTransferring ? "Unit ဖြည့်နေသည်…" : "Player ကို Unit ဖြည့်ရန်"}</Button></div></form> : <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Unit ဖြည့်နိုင်သော Active Player မရှိသေးပါ။ Player က invitation link ဖြင့် account ဖွင့်ပြီး password ပြောင်းပြီးနောက် Active ဖြစ်လာမည်။</div>}
    </section>

    <section className="mt-6 overflow-hidden border border-[#d8e3f6] bg-white"><div className="flex items-center gap-3 border-b border-[#d8e3f6] px-5 py-4"><History className="h-5 w-5 text-[#3979de]" /><div><h3 className="font-black text-slate-950">Unit transaction history</h3><p className="mt-1 text-xs text-slate-500">နောက်ဆုံး Unit issue နှင့် Player transfer 30 ခု</p></div></div>{overview?.transactions.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#f7faff] text-xs font-bold text-slate-500"><tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">To</th><th className="px-5 py-3">မှတ်ချက်</th><th className="px-5 py-3">အချိန်</th></tr></thead><tbody className="divide-y divide-slate-100">{overview.transactions.map(transaction => <tr key={transaction.id}><td className="px-5 py-4 font-bold text-slate-800">{transaction.transactionType === "admin_issue" ? "Admin → Agent" : "Agent → Player"}</td><td className="px-5 py-4 font-mono font-bold text-[#1e5fb8]">{transaction.amount}</td><td className="px-5 py-4 text-slate-600">{transaction.toOwnerType === "agent" ? "Agent" : `Player #${transaction.toOwnerId}`}</td><td className="px-5 py-4 text-slate-600">{transaction.note ?? "—"}</td><td className="px-5 py-4 text-slate-600">{new Date(transaction.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-slate-600"><WalletCards className="mx-auto h-7 w-7 text-[#3979de]" /><p className="mt-3">Unit transaction မရှိသေးပါ။</p></div>}</section>
  </div>;
}
