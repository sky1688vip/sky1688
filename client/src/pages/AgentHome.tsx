import { useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Ban,
  ClipboardCheck,
  Copy,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { humanizeError } from "@/lib/admin";
import { calculatePlayerAccountMetrics } from "@/lib/agentDashboard";
import {
  agentDashboardNavigationGroups,
  getAgentDashboardNavigationItem,
  type AgentDashboardSection,
} from "@/lib/agentDashboardNavigation";
import { getPlayerInvitationUrl } from "@/lib/playerInvitation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type IssuedInvite = { token: string; playerCode: string; temporaryPassword: string; expiresAt: Date } | null;
type PlayerCreateFormInput = {
  playerCode: string;
  password: string;
  phone: string;
  bankAccountName: string;
  bankType: string;
  streamerAccount: string;
  bankAccountNumber: string;
};
type InvitationSummary = {
  id: number;
  playerCode: string | null;
  phone: string | null;
  bankAccountName: string | null;
  bankType: string | null;
  streamerAccount: string | null;
  status: "issued" | "redeemed" | "revoked";
  expiresAt: Date;
  createdAt: Date;
};
type InvitationQueryState = {
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  data: InvitationSummary[] | undefined;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

function sectionIcon(section: AgentDashboardSection) {
  if (section === "dashboard" || section === "financialReport") return LayoutDashboard;
  if (section === "playerList" || section === "createPlayer") return Users;
  if (section === "betList" || section === "autoDepositList" || section === "autoWithdrawList") return ListChecks;
  if (section === "cashInOut" || section === "createDeposit" || section === "createWithdraw" || section === "cashBonus") return BadgeCheck;
  if (section === "userBankInfo" || section === "bankInfo") return KeyRound;
  return ClipboardCheck;
}

export default function AgentHome() {
  const { user, loading, logout } = useAuth();
  const [issuedInvite, setIssuedInvite] = useState<IssuedInvite>(null);
  const [copied, setCopied] = useState<"link" | "credentials" | null>(null);
  const [section, setSection] = useState<AgentDashboardSection>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const canLoadAgent = !loading && user?.role === "agent";
  const agent = trpc.accounts.agent.me.useQuery(undefined, { enabled: canLoadAgent });
  const canManageInvites = canLoadAgent && Boolean(agent.data && !agent.data.mustChangePassword);
  const invitations = trpc.accounts.agent.playerInvites.list.useQuery(undefined, { enabled: canManageInvites });
  const issueInvite = trpc.accounts.agent.playerInvites.create.useMutation({
    onSuccess: async data => {
      setIssuedInvite({ token: data.token, playerCode: data.playerCode, temporaryPassword: data.temporaryPassword, expiresAt: data.expiresAt });
      setCopied(null);
      await invitations.refetch();
    },
  });
  const revokeInvite = trpc.accounts.agent.playerInvites.revoke.useMutation({ onSuccess: () => invitations.refetch() });
  const invitationUrl = issuedInvite ? getPlayerInvitationUrl(window.location.origin, issuedInvite.token) : null;
  const metrics = calculatePlayerAccountMetrics(invitations.data);
  const selectedItem = getAgentDashboardNavigationItem(section);

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };
  const copyInvitation = async () => {
    if (!invitationUrl) return;
    await navigator.clipboard.writeText(invitationUrl);
    setCopied("link");
  };
  const copyPlayerCredentials = async () => {
    if (!issuedInvite) return;
    await navigator.clipboard.writeText(`Player ID: ${issuedInvite.playerCode}\nPassword: ${issuedInvite.temporaryPassword}`);
    setCopied("credentials");
  };
  const chooseSection = (nextSection: AgentDashboardSection) => {
    setSection(nextSection);
    setMobileSidebarOpen(false);
  };

  if (loading) return <PublicShell><div className="py-24"><QueryLoading /></div></PublicShell>;
  if (!user) return <PublicShell><AgentAccessGuard icon={<ShieldCheck className="mx-auto h-8 w-8 text-lime-200" />} title="Agent login လိုအပ်သည်" description="Admin ထုတ်ပေးသော Agent ID နှင့် password ကိုသုံးပါ။" /></PublicShell>;
  if (user.role !== "agent") return <PublicShell><AgentAccessGuard icon={<ClipboardCheck className="mx-auto h-8 w-8 text-lime-200" />} title="ဒီ account သည် Agent မဟုတ်ပါ" description="Admin ထုတ်ပေးသော Agent credential ဖြင့် Agent login စာမျက်နှာတွင်ဝင်ပါ။" /></PublicShell>;
  if (agent.isLoading) return <PublicShell><div className="py-24"><QueryLoading /></div></PublicShell>;
  if (agent.isError) return <PublicShell><div className="py-24"><QueryError label={humanizeError(agent.error)} onRetry={() => agent.refetch()} /></div></PublicShell>;
  if (!agent.data) return <PublicShell><div className="py-24"><QueryError label="Agent account record မတွေ့ပါ။" /></div></PublicShell>;
  if (agent.data.mustChangePassword) return <PublicShell><AgentAccessGuard icon={<KeyRound className="mx-auto h-8 w-8 text-lime-200" />} title="Password အသစ်ပြောင်းရန်လိုအပ်သည်" description="Temporary password ကိုမဆက်သုံးနိုင်ရန် password အသစ်ကို အရင်သတ်မှတ်ပါ။" actionHref="/agent/password" actionLabel="Password ပြောင်းရန်" /></PublicShell>;

  const renderWorkspace = () => {
    if (section === "dashboard") {
      return <AgentDashboard metrics={metrics} onOpenPlayers={() => setSection("playerList")} onCreatePlayer={() => setSection("createPlayer")} />;
    }
    if (section === "playerList" || section === "createPlayer") {
      return <PlayerAccountsPanel
        focus={section}
        invitations={invitations}
        issuedInvite={issuedInvite}
        invitationUrl={invitationUrl}
        copied={copied}
        onGoToCreate={() => setSection("createPlayer")}
        onCreate={input => issueInvite.mutate(input)}
        isCreating={issueInvite.isPending}
        createError={issueInvite.isError ? humanizeError(issueInvite.error) : null}
        onCopyInvitation={() => void copyInvitation()}
        onCopyCredentials={() => void copyPlayerCredentials()}
        onRevoke={id => revokeInvite.mutate({ id })}
        isRevoking={revokeInvite.isPending}
      />;
    }
    return <PlannedSection item={selectedItem} onGoToPlayers={() => setSection("playerList")} />;
  };

  return <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0c1615] text-white lg:flex">
      <div className="flex h-24 shrink-0 items-center gap-3 border-b border-white/10 px-6"><BrandLockup /></div>
      <SidebarNav section={section} onSelect={chooseSection} />
      <SidebarAccount fullName={agent.data.fullName} agentCode={agent.data.agentCode} onLogout={() => void handleLogout()} />
    </aside>
    {mobileSidebarOpen ? <div className="fixed inset-0 z-50 lg:hidden">
      <button aria-label="Menu ပိတ်ရန်" className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileSidebarOpen(false)} />
      <aside className="relative flex h-full w-72 flex-col bg-[#0c1615] text-white shadow-2xl">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5"><BrandLockup /><button aria-label="Menu ပိတ်ရန်" onClick={() => setMobileSidebarOpen(false)} className="rounded-lg p-2 text-emerald-50/70 hover:bg-white/10"><X className="h-5 w-5" /></button></div>
        <SidebarNav section={section} onSelect={chooseSection} />
        <div className="shrink-0 border-t border-white/10 p-4"><Button onClick={() => void handleLogout()} variant="ghost" className="w-full justify-start text-emerald-50/70 hover:bg-white/10 hover:text-white"><LogOut className="mr-2 h-4 w-4" />Agent logout</Button></div>
      </aside>
    </div> : null}
    <main className="min-h-screen lg:ml-64">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7"><div className="flex items-center gap-3"><button aria-label="Menu ဖွင့်ရန်" onClick={() => setMobileSidebarOpen(true)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Agent Workspace</p><h1 className="mt-0.5 text-sm font-bold text-slate-900">{selectedItem.label}</h1></div></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold text-slate-900">{agent.data.fullName}</p><p className="mt-0.5 font-mono text-xs text-slate-500">{agent.data.agentCode}</p></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#0c1615] text-sm font-black text-lime-200">{agent.data.fullName.charAt(0).toUpperCase()}</div></div></header>
      <div className="p-4 sm:p-7 lg:p-9">{renderWorkspace()}</div>
    </main>
  </div>;
}

function BrandLockup() {
  return <><div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-200 text-[#0c1615]"><BadgeCheck className="h-6 w-6" /></div><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-lime-200">SKY1688</p><p className="mt-1 text-sm font-black">AGENT PORTAL</p></div></>;
}

function SidebarAccount({ fullName, agentCode, onLogout }: { fullName: string; agentCode: string; onLogout: () => void }) {
  return <div className="shrink-0 border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/[.06] p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-lime-200/15 text-sm font-black text-lime-100">{fullName.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{fullName}</p><p className="mt-0.5 truncate font-mono text-[11px] text-emerald-50/50">{agentCode}</p></div></div><Button onClick={onLogout} variant="ghost" className="mt-3 w-full justify-start text-emerald-50/70 hover:bg-white/10 hover:text-white"><LogOut className="mr-2 h-4 w-4" />Agent logout</Button></div>;
}

function AgentAccessGuard({ icon, title, description, actionHref = "/agent/login", actionLabel = "Agent login ဝင်ရန်" }: { icon: React.ReactNode; title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20"><section className="golden-panel p-8 text-center"><div>{icon}</div><h1 className="mt-4 text-2xl font-black text-white">{title}</h1><p className="mt-3 text-sm leading-6 text-emerald-50/65">{description}</p><a href={actionHref} className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">{actionLabel}</a></section></div>;
}

function SidebarNav({ section, onSelect }: { section: AgentDashboardSection; onSelect: (section: AgentDashboardSection) => void }) {
  return <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{agentDashboardNavigationGroups.map((group, groupIndex) => <div key={group.label ?? groupIndex} className={groupIndex ? "mt-5" : ""}>{group.label ? <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-50/35">{group.label}</p> : null}{group.items.map(item => { const Icon = sectionIcon(item.id); return <button key={item.id} onClick={() => onSelect(item.id)} className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold ${section === item.id ? "bg-lime-200 text-[#0c1615]" : "text-emerald-50/70 hover:bg-white/8 hover:text-white"}`}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{item.label}</span>{item.active ? null : <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-50/55">မကြာမီ</span>}</button>; })}</div>)}</nav>;
}

function AgentDashboard({ metrics, onOpenPlayers, onCreatePlayer }: { metrics: { total: number; issued: number; activated: number; today: number }; onOpenPlayers: () => void; onCreatePlayer: () => void }) {
  const cards = [
    { label: "စုစုပေါင်း Player account", value: metrics.total, description: "Agent ထုတ်ပေးထားသော account အားလုံး" },
    { label: "ယနေ့အသစ်ထုတ်ထားသော account", value: metrics.today, description: "ဒီနေ့ထုတ်ပေးထားသော Player credential" },
    { label: "ဖွင့်ပြီး Player account", value: metrics.activated, description: "Invitation link ကိုအသုံးပြုပြီးသော account" },
    { label: "အသုံးပြုရန်ကျန်သော link", value: metrics.issued, description: "72 နာရီအတွင်းဖွင့်နိုင်သေးသော link" },
  ];
  return <div><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#4476bf]">Agent Dashboard</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Player account overview</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Player ID, password, phone နှင့် bank profile ကို Agent မှဖန်တီးပေးနိုင်သည်။ Link သည် တစ်ကြိမ်သာအသုံးပြုနိုင်ပြီး Player ကိုယ်တိုင်ပထမဝင်ရောက်မှုတွင် password ပြောင်းရမည်။</p></div><Button onClick={onCreatePlayer} className="bg-[#3979de] text-white hover:bg-[#2465c8]"><UserPlus className="mr-2 h-4 w-4" />Player account ထုတ်ရန်</Button></div><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <div key={card.label} className="min-h-40 border border-[#9ebce8] bg-white p-5 shadow-[0_3px_10px_rgba(47,101,184,0.08)]"><p className="text-sm font-bold text-slate-700">{card.label}</p><p className="mt-6 text-4xl font-black tracking-tight text-slate-950">{card.value}</p><p className="mt-4 text-xs leading-5 text-slate-500">{card.description}</p></div>)}</div><section className="mt-6 border border-[#d8e3f6] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#4476bf]">Player setup</p><h3 className="mt-2 text-xl font-black text-slate-950">Player credential ထုတ်ပေးရန်အဆင်သင့်ဖြစ်နေပါပြီ</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Player account ဖန်တီးပြီးနောက် link၊ Player ID နှင့် initial password ကို Player ထံသို့လုံခြုံစွာပေးပါ။</p></div><Button onClick={onOpenPlayers} variant="outline" className="border-[#8bafe4] text-[#1e5fb8] hover:bg-[#edf4ff]">Player စာရင်းကြည့်ရန်</Button></div></section></div>;
}

function PlannedSection({ item, onGoToPlayers }: { item: ReturnType<typeof getAgentDashboardNavigationItem>; onGoToPlayers: () => void }) {
  const Icon = sectionIcon(item.id);
  const isCashOrBetting = ["financialReport", "betList", "cashInOut", "autoDepositList", "createDeposit", "autoWithdrawList", "createWithdraw", "cashBonus"].includes(item.id);
  return <div className="mx-auto max-w-3xl py-5 sm:py-12"><section className="border border-[#d8e3f6] bg-white p-7 shadow-[0_8px_24px_rgba(47,101,184,0.07)] sm:p-10"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#edf4ff] text-[#3979de]"><Icon className="h-6 w-6" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#4476bf]">Planned section</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{item.label}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">ဒီ menu ကို Agent dashboard တွင်ထည့်ထားပြီးပါပြီ။ လက်ရှိ database၊ API နှင့် transaction workflow ကို မချိတ်ဆက်ရသေးသောကြောင့် အချက်အလက်မဖန်တီး၊ မပြင်ဆင်၊ မလုပ်ဆောင်ပါ။</p>{isCashOrBetting ? <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">ဤအပိုင်းသည် ငွေကြေး သို့မဟုတ် ကစားမှုမှတ်တမ်းဆိုင်ရာလုပ်ဆောင်ချက်ဖြစ်နိုင်သဖြင့် အသုံးပြုသူစည်းမျဉ်းများ၊ အသက်ကန့်သတ်ချက်၊ KYC/AML နှင့် သက်ဆိုင်ရာလိုင်စင်လိုအပ်ချက်များကို သတ်မှတ်ပြီးမှ backend workflow ကိုတစ်ခုချင်းစီတည်ဆောက်ပါမည်။</div> : <div className="mt-6 border border-[#d8e3f6] bg-[#f7faff] p-4 text-sm leading-6 text-slate-600">ဒီအပိုင်းအတွက် လိုအပ်သော data fields၊ Agent permission နှင့် action rules ကိုသင်သတ်မှတ်ပေးသောအခါ အလုပ်လုပ်သည့်စာမျက်နှာအဖြစ်ဆက်တည်ဆောက်နိုင်သည်။</div>}<div className="mt-7 flex flex-wrap gap-3"><Button onClick={onGoToPlayers} className="bg-[#3979de] text-white hover:bg-[#2465c8]"><Users className="mr-2 h-4 w-4" />Player account စီမံရန်</Button></div></section></div>;
}

function PlayerAccountsPanel({ focus, invitations, issuedInvite, invitationUrl, copied, onGoToCreate, onCreate, isCreating, createError, onCopyInvitation, onCopyCredentials, onRevoke, isRevoking }: { focus: "playerList" | "createPlayer"; invitations: InvitationQueryState; issuedInvite: IssuedInvite; invitationUrl: string | null; copied: "link" | "credentials" | null; onGoToCreate: () => void; onCreate: (input: PlayerCreateFormInput) => void; isCreating: boolean; createError: string | null; onCopyInvitation: () => void; onCopyCredentials: () => void; onRevoke: (id: number) => void; isRevoking: boolean }) {
  const isCreateMode = focus === "createPlayer";
  return <div><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#4476bf]">{isCreateMode ? "Create user" : "User list"}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{isCreateMode ? "Player account အသစ်ထုတ်ရန်" : "Player ID နှင့် link စီမံရန်"}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Player account တစ်ခုစီအတွက် Agent က Player ID, initial password နှင့် အခြေခံ profile ကိုထည့်သွင်းပေးရမည်။</p></div>{isCreateMode ? null : <Button onClick={onGoToCreate} className="bg-[#3979de] text-white hover:bg-[#2465c8]"><UserPlus className="mr-2 h-4 w-4" />Player account အသစ်ထုတ်ရန်</Button>}</div>{isCreateMode ? <PlayerCreateForm onCreate={onCreate} isCreating={isCreating} error={createError} /> : null}{issuedInvite && invitationUrl ? <IssuedCredentialPanel issuedInvite={issuedInvite} invitationUrl={invitationUrl} copied={copied} onCopyInvitation={onCopyInvitation} onCopyCredentials={onCopyCredentials} /> : null}<PlayerListTable invitations={invitations} onRevoke={onRevoke} isRevoking={isRevoking} /></div>;
}

function PlayerCreateForm({ onCreate, isCreating, error }: { onCreate: (input: PlayerCreateFormInput) => void; isCreating: boolean; error: string | null }) {
  const [form, setForm] = useState<PlayerCreateFormInput>({ playerCode: "", password: "", phone: "", bankAccountName: "", bankType: "", streamerAccount: "မရှိပါ", bankAccountNumber: "" });
  const update = (field: keyof PlayerCreateFormInput, value: string) => setForm(current => ({ ...current, [field]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate(form);
  };
  const inputClass = "h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#3979de] focus:ring-2 focus:ring-[#3979de]/15";
  return <section className="mt-6 max-w-4xl border border-[#d8e3f6] bg-white p-5 shadow-[0_6px_20px_rgba(47,101,184,0.06)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#4476bf]">Create user</p><h3 className="mt-2 text-xl font-black text-slate-950">Player profile နှင့် credential ဖြည့်ရန်</h3><p className="mt-2 text-sm leading-6 text-slate-600">Player ID တွင် space မပါရပါ။ Bank account number ကို database တွင် encrypted form ဖြင့်သာသိမ်းဆည်းသည်။</p></div><KeyRound className="h-6 w-6 text-[#3979de]" /></div><form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]"><FormLabel label="Player ID (no space)" required /><div><input className={inputClass} value={form.playerCode} onChange={event => update("playerCode", event.target.value)} placeholder="ဥပမာ: PLAYER001" autoComplete="off" required /><p className="mt-1.5 text-xs text-slate-500">အက္ခရာ၊ နံပါတ်၊ underscore (_) နှင့် hyphen (-) ကိုသာသုံးပါ။</p></div><FormLabel label="Password" required /><input className={inputClass} type="password" value={form.password} onChange={event => update("password", event.target.value)} minLength={12} placeholder="အနည်းဆုံး 12 characters" autoComplete="new-password" required /><FormLabel label="Phone" required /><input className={inputClass} type="tel" value={form.phone} onChange={event => update("phone", event.target.value)} placeholder="09xxxxxxxxx" autoComplete="tel" required /><FormLabel label="Bank Account name" required /><input className={inputClass} value={form.bankAccountName} onChange={event => update("bankAccountName", event.target.value)} placeholder="Account holder name" autoComplete="name" required /><FormLabel label="Bank Type" required /><select className={inputClass} value={form.bankType} onChange={event => update("bankType", event.target.value)} required><option value="" disabled>ရွေးချယ်ပါ</option><option value="KBZ Bank">KBZ Bank</option><option value="AYA Bank">AYA Bank</option><option value="CB Bank">CB Bank</option><option value="Other">Other</option></select><FormLabel label="Streamer Account" required /><select className={inputClass} value={form.streamerAccount} onChange={event => update("streamerAccount", event.target.value)} required><option value="မရှိပါ">မရှိပါ</option><option value="ရှိပါ">ရှိပါ</option><option value="အခြား">အခြား</option></select><FormLabel label="Bank Account Number" required /><input className={inputClass} value={form.bankAccountNumber} onChange={event => update("bankAccountNumber", event.target.value)} placeholder="Bank account number" inputMode="numeric" autoComplete="off" required /><div className="md:col-start-2">{error ? <p className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={isCreating} className="bg-[#8d4ce9] text-white hover:bg-[#7838cf]"><UserPlus className="mr-2 h-4 w-4" />{isCreating ? "Player account ထုတ်နေသည်…" : "Create"}</Button></div></form></section>;
}

function FormLabel({ label, required }: { label: string; required?: boolean }) {
  return <label className="pt-2 text-right text-sm font-bold leading-5 text-slate-600 md:text-right">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</label>;
}

function IssuedCredentialPanel({ issuedInvite, invitationUrl, copied, onCopyInvitation, onCopyCredentials }: { issuedInvite: NonNullable<IssuedInvite>; invitationUrl: string; copied: "link" | "credentials" | null; onCopyInvitation: () => void; onCopyCredentials: () => void }) {
  return <section className="mt-6 border border-[#8cbee7] bg-[#eef7ff] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2570bd]">Current session only</p><h3 className="mt-2 text-xl font-black text-slate-950">ယခုထုတ်ပေးထားသော Player login အချက်အလက်</h3></div><KeyRound className="h-6 w-6 text-[#2570bd]" /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><CredentialField label="Player ID" value={issuedInvite.playerCode} /><CredentialField label="Initial password" value={issuedInvite.temporaryPassword} /></div><div className="mt-5 border-t border-[#c8dbf2] pt-4"><p className="text-xs font-bold text-slate-600">Player invitation link</p><p className="mt-2 break-all font-mono text-xs leading-6 text-slate-700">{invitationUrl}</p></div><div className="mt-5 flex flex-wrap gap-3"><Button type="button" onClick={onCopyInvitation} className="bg-[#3979de] text-white hover:bg-[#2465c8]"><Copy className="mr-2 h-4 w-4" />{copied === "link" ? "Link ကူးပြီးပါပြီ" : "Link ကူးရန်"}</Button><Button type="button" onClick={onCopyCredentials} variant="outline" className="border-[#8bafe4] text-[#1e5fb8] hover:bg-white"><Copy className="mr-2 h-4 w-4" />{copied === "credentials" ? "ကူးပြီးပါပြီ" : "ID / password ကူးရန်"}</Button></div><p className="mt-4 text-xs leading-5 text-slate-500">Player သည် link ကိုဖွင့်ပြီး Player ID/password ဖြင့်ဝင်ရမည်။ ပထမဝင်ရောက်ပြီးနောက် password အသစ်ပြောင်းခိုင်းမည်။</p></section>;
}

function PlayerListTable({ invitations, onRevoke, isRevoking }: { invitations: InvitationQueryState; onRevoke: (id: number) => void; isRevoking: boolean }) {
  return <section className="mt-6 overflow-hidden border border-[#d8e3f6] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e3f6] px-5 py-4"><div><h3 className="font-black text-slate-950">ထုတ်ပေးထားသော Player account များ</h3><p className="mt-1 text-xs text-slate-500">Bank account number ကို list မှာမပြပါ။</p></div><ListChecks className="h-5 w-5 text-[#3979de]" /></div>{invitations.isLoading ? <div className="p-7"><QueryLoading /></div> : invitations.data?.length ? <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-[#f7faff] text-xs font-bold text-slate-500"><tr><th className="px-5 py-3">Player ID</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Bank Type</th><th className="px-5 py-3">Streamer</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Expires</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{invitations.data.map(invitation => <tr key={invitation.id} className="text-sm"><td className="px-5 py-4 font-mono font-bold text-slate-900">{invitation.playerCode || `Player #${invitation.id}`}</td><td className="px-5 py-4 text-slate-600">{invitation.phone || "—"}</td><td className="px-5 py-4 text-slate-600">{invitation.bankType || "—"}</td><td className="px-5 py-4 text-slate-600">{invitation.streamerAccount || "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${invitation.status === "issued" ? "bg-amber-50 text-amber-700" : invitation.status === "redeemed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{invitation.status === "issued" ? "အသုံးပြုရန်ရှိ" : invitation.status === "redeemed" ? "ဖွင့်ပြီး" : "ပယ်ဖျက်ပြီး"}</span></td><td className="px-5 py-4 text-slate-600">{formatDate(invitation.expiresAt)}</td><td className="px-5 py-4 text-right">{invitation.status === "issued" ? <Button onClick={() => onRevoke(invitation.id)} disabled={isRevoking} variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50"><Ban className="mr-1.5 h-3.5 w-3.5" />ပယ်ဖျက်ရန်</Button> : "—"}</td></tr>)}</tbody></table></div> : <div className="p-9 text-center"><Link2 className="mx-auto h-7 w-7 text-[#3979de]" /><h4 className="mt-3 font-black text-slate-950">Player account မထုတ်ရသေးပါ</h4><p className="mt-2 text-sm text-slate-600">Create user ကိုရွေးပြီး Player link၊ Player ID နှင့် initial password ကိုထုတ်ပေးပါ။</p></div>}</section>;
}

function CredentialField({ label, value }: { label: string; value: string }) {
  return <div className="border border-[#c8dbf2] bg-white p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 break-all font-mono text-sm font-bold text-slate-950">{value}</p></div>;
}
