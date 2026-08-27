import { useMemo, useState, type FormEvent } from "react";
import { ClipboardList, PlusCircle, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AdminUnitAgent = { id: number; fullName: string; agentCode: string; status: "invited" | "active" | "suspended"; availableUnits: number | null };
type UnitTransaction = { id: number; transactionType: "admin_issue" | "agent_transfer" | "agent_adjustment_credit" | "agent_adjustment_debit"; amount: number; toOwnerType: "agent" | "player"; toOwnerId: number; note: string | null; createdAt: Date };

export function AdminUnitIssuancePanel({ agents, history, isLoading, error, onRetry, onIssue, isIssuing, issueError }: {
  agents: AdminUnitAgent[] | undefined;
  history: UnitTransaction[] | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onIssue: (input: { agentId: number; amount: number; note?: string }) => void;
  isIssuing: boolean;
  issueError: string | null;
}) {
  const [agentId, setAgentId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const activeAgents = useMemo(() => agents?.filter(agent => agent.status === "active") ?? [], [agents]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onIssue({ agentId: Number(agentId), amount: Number(amount), note: note.trim() || undefined }); };
  if (isLoading) return <section className="mt-7 admin-card p-6 text-sm text-emerald-50/60">Agent Unit balance ကိုဖတ်နေသည်…</section>;
  if (error) return <section className="mt-7 border border-red-300/25 bg-red-300/10 p-5 text-sm text-red-100">{error}<Button className="ml-3" variant="outline" onClick={onRetry}>ပြန်စမ်းရန်</Button></section>;
  return <section className="mt-7 admin-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-lime-200/80">Internal Unit ledger</p><h2 className="mt-2 text-xl font-black text-white">Agent ကို Unit ဖြည့်ရန်</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/65">Admin က active Agent များကို Unit ထုတ်ပေးနိုင်သည်။ Agent → Player transfer များအပါအဝင် ledger transaction တိုင်းကိုပြန်လည်စစ်ဆေးနိုင်အောင်သိမ်းထားသည်။</p></div><WalletCards className="h-6 w-6 text-lime-200" /></div>
    {issueError ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{issueError}</p> : null}
    {activeAgents.length ? <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-3"><div><Label>Agent</Label><select required value={agentId} onChange={event => setAgentId(event.target.value)} className="admin-input mt-2 h-10 w-full px-3 text-sm"><option value="" disabled>Agent ကိုရွေးပါ</option>{activeAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.fullName} ({agent.agentCode}) · {agent.availableUnits ?? 0} Unit</option>)}</select></div><div><Label>ဖြည့်မည့် Unit</Label><Input required type="number" min="1" max="1000000" value={amount} onChange={event => setAmount(event.target.value)} className="admin-input mt-2" /></div><div><Label>မှတ်ချက် (မဖြည့်လည်းရ)</Label><Input maxLength={240} value={note} onChange={event => setNote(event.target.value)} className="admin-input mt-2" placeholder="ဥပမာ — Admin allocation" /></div><div className="md:col-span-3"><Button disabled={isIssuing} className="bg-lime-200 text-[#09221c] hover:bg-lime-100"><PlusCircle className="mr-2 h-4 w-4" />{isIssuing ? "Unit ဖြည့်နေသည်…" : "Agent ကို Unit ဖြည့်ရန်"}</Button></div></form> : <p className="mt-6 border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">Unit ဖြည့်နိုင်သော active Agent မရှိသေးပါ။ Agent login နှင့် password change ပြီးသွားသော Agent ကိုသာရွေးနိုင်သည်။</p>}
    <div className="mt-7 overflow-hidden rounded-xl border border-white/10"><div className="flex items-center gap-3 bg-white/[0.045] px-5 py-3"><ClipboardList className="h-4 w-4 text-lime-200" /><div><p className="text-sm font-bold text-white">နောက်ဆုံး Unit ledger</p><p className="mt-0.5 text-xs text-emerald-50/50">Admin issue နှင့် Player Unit adjustment 50 ခု</p></div></div>{history?.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-black/10 text-xs font-bold text-emerald-50/45"><tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">မှတ်ချက်</th><th className="px-5 py-3">အချိန်</th></tr></thead><tbody className="divide-y divide-white/8">{history.map(transaction => <tr key={transaction.id} className="text-emerald-50/75"><td className="px-5 py-4 font-bold text-white">{transaction.transactionType === "admin_issue" ? "Admin → Agent" : transaction.transactionType === "agent_adjustment_debit" ? "Player → Agent" : "Agent → Player"}</td><td className="px-5 py-4 font-mono text-lime-100">{transaction.amount}</td><td className="px-5 py-4">{transaction.toOwnerType === "agent" ? "Agent" : `Player #${transaction.toOwnerId}`}</td><td className="px-5 py-4">{transaction.note ?? "—"}</td><td className="px-5 py-4">{new Date(transaction.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="p-6 text-sm text-emerald-50/50">Unit transaction မရှိသေးပါ။</div>}</div>
  </section>;
}
