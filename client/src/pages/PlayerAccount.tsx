import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  Gift,
  History,
  House,
  KeyRound,
  LayoutGrid,
  LogOut,
  NotebookText,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";

type PlayerView = "home" | "profile" | "units";
type PlayerAsset = { slot: "brand_logo" | "hero_banner" | "quick_result" | "quick_dream" | "quick_unit" | "quick_profile" | "notice_icon"; imageUrl: string; altText: string };

function formatUnits(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTransactionType(type: "admin_issue" | "agent_transfer" | "agent_adjustment_credit" | "agent_adjustment_debit") {
  if (type === "agent_transfer") return "Agent မှ Unit ဖြည့်ပေးမှု";
  if (type === "agent_adjustment_credit") return "Agent မှ Unit ထပ်ဖြည့်မှု";
  if (type === "agent_adjustment_debit") return "Agent မှ Unit ပြန်နှုတ်မှု";
  return "Unit မှတ်တမ်း";
}

function formatTransactionDirection(type: "admin_issue" | "agent_transfer" | "agent_adjustment_credit" | "agent_adjustment_debit") {
  return type === "agent_adjustment_debit" ? "−" : "+";
}

export default function PlayerAccount() {
  const [playerCode, setPlayerCode] = useState(() => window.localStorage.getItem("sky1688_saved_player_code") ?? "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPlayerId, setRememberPlayerId] = useState(Boolean(window.localStorage.getItem("sky1688_saved_player_code")));
  const [loginCompleted, setLoginCompleted] = useState(false);
  const [view, setView] = useState<PlayerView>("home");
  const session = trpc.accounts.player.session.useQuery(undefined, { retry: false });
  const playerAssets = trpc.playerAssets.list.useQuery(undefined, { retry: false });
  const unitOverview = trpc.units.player.overview.useQuery(undefined, { enabled: Boolean(session.data && !session.data.mustChangePassword), retry: false });
  const login = trpc.accounts.player.login.useMutation({
    onSuccess: () => {
      if (rememberPlayerId) window.localStorage.setItem("sky1688_saved_player_code", playerCode.trim().toUpperCase());
      else window.localStorage.removeItem("sky1688_saved_player_code");
      setError(null);
      setPassword("");
      // Let the response complete before navigating so a new httpOnly Player
      // session cookie is not raced by the next page request.
      setLoginCompleted(true);
    },
    onError: failure => setError(humanizeError(failure)),
  });
  const changePassword = trpc.accounts.player.changePassword.useMutation({
    onSuccess: () => {
      setError(null);
      setNewPassword("");
      setConfirmPassword("");
      window.location.assign("/player");
    },
    onError: failure => setError(humanizeError(failure)),
  });
  const logout = trpc.accounts.player.logout.useMutation({ onSuccess: () => window.location.assign("/player") });
  const profile = session.data;
  const assetList = (playerAssets.data ?? []) as PlayerAsset[];
  const brandLogoUrl = assetList.find(asset => asset.slot === "brand_logo")?.imageUrl;

  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    login.mutate({ playerCode, password });
  };

  const submitPasswordChange = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Password နှစ်ခုတူညီရပါမည်။");
      return;
    }
    setError(null);
    changePassword.mutate({ newPassword });
  };

  if (session.isLoading) return <PublicShell variant="player" brandLogoUrl={brandLogoUrl}><PlayerShell><LoadingPanel /></PlayerShell></PublicShell>;
  if (session.isError) return <PublicShell variant="player" brandLogoUrl={brandLogoUrl}><PlayerShell><ErrorPanel label={humanizeError(session.error)} onRetry={() => session.refetch()} /></PlayerShell></PublicShell>;
  if (!profile) return <PublicShell variant="player" brandLogoUrl={brandLogoUrl}><PlayerShell>{loginCompleted ? <PlayerLoginComplete onContinue={() => window.location.assign("/player")} /> : <PlayerLoginForm playerCode={playerCode} password={password} error={error} isPending={login.isPending} rememberPlayerId={rememberPlayerId} showPassword={showPassword} onPlayerCodeChange={setPlayerCode} onPasswordChange={setPassword} onRememberChange={setRememberPlayerId} onShowPasswordChange={setShowPassword} onSubmit={submitLogin} />}</PlayerShell></PublicShell>;
  if (profile.mustChangePassword) return <PublicShell variant="player" brandLogoUrl={brandLogoUrl}><PlayerShell><PasswordChangeForm newPassword={newPassword} confirmPassword={confirmPassword} error={error} isPending={changePassword.isPending} onNewPasswordChange={setNewPassword} onConfirmPasswordChange={setConfirmPassword} onSubmit={submitPasswordChange} /></PlayerShell></PublicShell>;

  return <PublicShell variant="player" brandLogoUrl={brandLogoUrl}><PlayerShell><PlayerMobileApp profile={profile} view={view} units={unitOverview.data} assets={assetList} unitsLoading={unitOverview.isLoading} unitsError={unitOverview.isError ? humanizeError(unitOverview.error) : null} onRetryUnits={() => unitOverview.refetch()} onNavigate={setView} onLogout={() => logout.mutate()} isLoggingOut={logout.isPending} /></PlayerShell></PublicShell>;
}

function PlayerShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-[calc(100vh-76px)] max-w-md px-4 py-6 pb-28 sm:px-6 sm:py-10">{children}</div>;
}

function PlayerLoginForm({ playerCode, password, error, isPending, rememberPlayerId, showPassword, onPlayerCodeChange, onPasswordChange, onRememberChange, onShowPasswordChange, onSubmit }: { playerCode: string; password: string; error: string | null; isPending: boolean; rememberPlayerId: boolean; showPassword: boolean; onPlayerCodeChange: (value: string) => void; onPasswordChange: (value: string) => void; onRememberChange: (value: boolean) => void; onShowPasswordChange: (value: boolean) => void; onSubmit: (event: React.FormEvent) => void }) {
  return <div className="pt-8 sm:pt-14"><form onSubmit={onSubmit} className="rounded-[2rem] border border-emerald-900/10 bg-white px-6 py-8 text-slate-950 shadow-[0_22px_65px_rgba(42,194,151,.22)] sm:px-9 sm:py-10"><p className="text-xs font-black uppercase tracking-[.32em] text-emerald-700">Golden Money</p><h1 className="mt-3 font-display text-4xl font-black tracking-tight text-[#071a16]">ဝင်ရောက်ရန်</h1><p className="mt-4 text-sm leading-6 text-slate-500">Agent ပေးသော Player ID နှင့် password ဖြင့်လုံခြုံစွာဝင်ပါ။ Account အသစ်အတွက် Agent invitation link လိုအပ်သည်။</p><div className="mt-8 grid gap-5"><div className="grid gap-2"><Label htmlFor="existing-player-code" className="font-bold text-slate-700">Username</Label><Input id="existing-player-code" value={playerCode} onChange={event => onPlayerCodeChange(event.target.value.toUpperCase())} autoComplete="username" placeholder="ဥပမာ — PLAYER225" required className="h-13 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950" /></div><div className="grid gap-2"><Label htmlFor="existing-player-password" className="font-bold text-slate-700">Password</Label><div className="relative"><Input id="existing-player-password" type={showPassword ? "text" : "password"} value={password} onChange={event => onPasswordChange(event.target.value)} autoComplete="current-password" required className="h-13 rounded-2xl border-slate-200 bg-white px-4 pr-12 text-base text-slate-950" /><button type="button" aria-label={showPassword ? "Password ဖျောက်ရန်" : "Password ပြရန်"} onClick={() => onShowPasswordChange(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div></div><label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-semibold text-emerald-800"><input type="checkbox" checked={rememberPlayerId} onChange={event => onRememberChange(event.target.checked)} className="h-5 w-5 accent-emerald-700" />Player ID ကို ဤစက်တွင် မှတ်ထားရန်</label>{error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</p> : null}<Button type="submit" disabled={isPending} className="mt-7 h-14 w-full rounded-2xl bg-emerald-700 text-lg font-black text-white shadow-[0_12px_22px_rgba(5,150,105,.28)] hover:bg-emerald-800"><KeyRound className="mr-2 h-5 w-5" />{isPending ? "ဝင်ရောက်နေသည်…" : "ဝင်ရောက်မည်"}</Button></form></div>;
}

function PasswordChangeForm({ newPassword, confirmPassword, error, isPending, onNewPasswordChange, onConfirmPasswordChange, onSubmit }: { newPassword: string; confirmPassword: string; error: string | null; isPending: boolean; onNewPasswordChange: (value: string) => void; onConfirmPasswordChange: (value: string) => void; onSubmit: (event: React.FormEvent) => void }) {
  return <div className="pt-8 sm:pt-14"><form onSubmit={onSubmit} className="rounded-[2rem] border border-emerald-900/10 bg-white px-6 py-8 text-slate-950 shadow-[0_22px_65px_rgba(42,194,151,.22)] sm:px-9 sm:py-10"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-6 w-6" /></div><p className="mt-7 text-xs font-black uppercase tracking-[.28em] text-emerald-700">Secure first login</p><h1 className="mt-3 font-display text-3xl font-black text-[#071a16]">Password အသစ်သတ်မှတ်ရန်</h1><p className="mt-4 text-sm leading-6 text-slate-500">Account လုံခြုံရေးအတွက် Agent ပေးထားသော initial password ကိုဆက်မသုံးပါနှင့်။</p><div className="mt-8 grid gap-5"><div className="grid gap-2"><Label htmlFor="new-player-password" className="font-bold text-slate-700">Password အသစ်</Label><Input id="new-player-password" type="password" value={newPassword} onChange={event => onNewPasswordChange(event.target.value)} autoComplete="new-password" required className="h-13 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950" /></div><div className="grid gap-2"><Label htmlFor="confirm-player-password" className="font-bold text-slate-700">Password အသစ်အတည်ပြုရန်</Label><Input id="confirm-player-password" type="password" value={confirmPassword} onChange={event => onConfirmPasswordChange(event.target.value)} autoComplete="new-password" required className="h-13 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950" /></div></div>{error ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</p> : null}<Button type="submit" disabled={isPending} className="mt-7 h-14 w-full rounded-2xl bg-emerald-700 text-lg font-black text-white hover:bg-emerald-800"><KeyRound className="mr-2 h-5 w-5" />{isPending ? "သိမ်းနေသည်…" : "Password အသစ်သတ်မှတ်မည်"}</Button></form></div>;
}

function PlayerLoginComplete({ onContinue }: { onContinue: () => void }) {
  return <div className="pt-12 sm:pt-16"><section className="rounded-[2rem] border border-emerald-900/10 bg-white px-6 py-10 text-center text-slate-950 shadow-[0_22px_65px_rgba(42,194,151,.22)] sm:px-9"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-7 w-7" /></div><p className="mt-7 text-xs font-black uppercase tracking-[.28em] text-emerald-700">Login successful</p><h1 className="mt-3 font-display text-3xl font-black text-[#071a16]">ဝင်ရောက်မှုအောင်မြင်ပါသည်</h1><p className="mt-4 text-sm leading-6 text-slate-500">လုံခြုံသော Player session ကိုသိမ်းဆည်းပြီးပါပြီ။ Player Home သို့ဆက်လက်ဝင်ရန်အောက်ပါခလုတ်ကိုနှိပ်ပါ။</p><Button onClick={onContinue} className="mt-8 h-14 w-full rounded-2xl bg-emerald-700 text-lg font-black text-white hover:bg-emerald-800">Player Home သို့ဆက်ရန်</Button></section></div>;
}

function PlayerMobileApp({ profile, view, units, assets, unitsLoading, unitsError, onRetryUnits, onNavigate, onLogout, isLoggingOut }: { profile: { id: number; displayName: string | null; playerCode: string | null; status: "invited" | "active" | "suspended"; mustChangePassword: boolean; activatedAt: Date | null }; view: PlayerView; units: { availableUnits: number; transactions: Array<{ id: number; transactionType: "admin_issue" | "agent_transfer" | "agent_adjustment_credit" | "agent_adjustment_debit"; amount: number; fromOwnerType: "system" | "agent" | "player"; toOwnerType: "agent" | "player"; note: string | null; createdAt: Date }> } | undefined; assets: PlayerAsset[]; unitsLoading: boolean; unitsError: string | null; onRetryUnits: () => void; onNavigate: (view: PlayerView) => void; onLogout: () => void; isLoggingOut: boolean }) {
  const displayName = profile.displayName || profile.playerCode || "SKY1688 Player";
  const balance = units?.availableUnits ?? 0;
  const backTitle = view === "profile" ? "Profile" : "Unit လက်ကျန်";

  return <div className="pb-5"><header className="flex items-center justify-between py-2"><div>{view === "home" ? <><p className="text-xs font-black uppercase tracking-[.28em] text-lime-200">Golden Money</p><h1 className="mt-2 font-display text-2xl font-black text-white">မင်္ဂလာပါ {displayName}</h1></> : <button onClick={() => onNavigate("home")} className="inline-flex items-center gap-2 text-base font-bold text-emerald-50/90"><ArrowLeft className="h-5 w-5" />{backTitle}</button>}</div><div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-lime-200/30 bg-lime-200/10 text-lime-100">{assetFor(assets, "quick_profile") ? <img src={assetFor(assets, "quick_profile")!.imageUrl} alt={assetFor(assets, "quick_profile")!.altText} className="h-full w-full object-contain" /> : <UserRound className="h-5 w-5" />}</div></header>{view === "home" ? <PlayerHome displayName={displayName} playerCode={profile.playerCode} balance={balance} assets={assets} onNavigate={onNavigate} /> : null}{view === "profile" ? <PlayerProfile displayName={displayName} playerCode={profile.playerCode} balance={balance} onNavigate={onNavigate} onLogout={onLogout} isLoggingOut={isLoggingOut} /> : null}{view === "units" ? <PlayerUnits balance={balance} units={units} isLoading={unitsLoading} error={unitsError} onRetry={onRetryUnits} /> : null}<BottomNavigation activeView={view} onNavigate={onNavigate} /></div>;
}

function assetFor(assets: PlayerAsset[], slot: PlayerAsset["slot"]) { return assets.find(asset => asset.slot === slot); }

function PlayerHome({ displayName, playerCode, balance, assets, onNavigate }: { displayName: string; playerCode: string | null; balance: number; assets: PlayerAsset[]; onNavigate: (view: PlayerView) => void }) {
  const hero = assetFor(assets, "hero_banner"); const result = assetFor(assets, "quick_result"); const dream = assetFor(assets, "quick_dream"); const unit = assetFor(assets, "quick_unit"); const profile = assetFor(assets, "quick_profile"); const notice = assetFor(assets, "notice_icon");
  return <><div className="mt-5 flex items-center gap-3 border border-lime-200/20 bg-[#0b402f] px-4 py-3 text-sm text-lime-50/90"><Bell className="h-4 w-4 shrink-0 text-lime-200" /><p className="truncate">2D / 3D result များကို SKY1688 မှ publish ပြုလုပ်ပြီးနောက်ကြည့်ရှုနိုင်ပါသည်။</p></div><section className="relative mt-4 overflow-hidden rounded-[1.7rem] border border-lime-200/25 bg-[radial-gradient(circle_at_88%_22%,rgba(190,242,100,.34),transparent_24%),linear-gradient(135deg,#08543d,#07815d_55%,#0c9b70)] p-6 shadow-[0_18px_45px_rgba(5,150,105,.35)]">{hero ? <img src={hero.imageUrl} alt={hero.altText} className="absolute inset-0 h-full w-full object-cover opacity-55" /> : <><div aria-hidden="true" className="absolute -right-6 top-12 grid h-36 w-36 place-items-center rounded-full border-[12px] border-lime-200/15 text-5xl font-black text-lime-100/20">2D</div><div aria-hidden="true" className="absolute -right-10 bottom-0 h-28 w-72 rotate-[-18deg] bg-lime-200/10" /></>}<div className="absolute inset-0 bg-[#063a2c]/25" /><div className="relative"><p className="text-xs font-black uppercase tracking-[.3em] text-lime-100/85">Golden Money · SKY1688</p><h2 className="mt-5 max-w-[12rem] font-display text-4xl font-black leading-[1.05] text-white">2D / 3D<br />Result ကိုကြည့်ရန်</h2><p className="mt-4 max-w-[13rem] text-sm leading-6 text-emerald-50/90">နေ့စဉ်ထုတ်ပြန်သော result နှင့် Dream1000 content များကိုလွယ်ကူစွာဝင်ရောက်ကြည့်ပါ။</p><a href="/results" className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-lime-200 px-4 text-sm font-black text-[#07543e] shadow-[0_8px_20px_rgba(190,242,100,.25)]">Result ကြည့်ရန် <ChevronRight className="h-4 w-4" /></a></div></section><section className="mt-4 grid grid-cols-4 gap-2 border border-lime-200/15 bg-[#0b3a2e] p-3"><QuickAction icon={<Plus className="h-5 w-5" />} image={result} label="Result" onClick={() => window.location.assign("/results")} /><QuickAction icon={<Send className="h-5 w-5" />} image={dream} label="Dream" onClick={() => window.location.assign("/dreams")} /><QuickAction icon={<WalletCards className="h-5 w-5" />} image={unit} label="Unit" onClick={() => onNavigate("units")} /><QuickAction icon={<CircleUserRound className="h-5 w-5" />} image={profile} label="Profile" onClick={() => onNavigate("profile")} /></section><section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.24em] text-lime-200">Quick access</p><h2 className="mt-2 text-2xl font-black text-lime-100">လွယ်ကူစွာဝင်ရောက်ရန်</h2></div><button onClick={() => onNavigate("units")} className="text-sm font-bold text-lime-200 hover:text-lime-100">{formatUnits(balance)} Unit</button></div><div className="mt-4 grid grid-cols-4 gap-2"><ServiceTile icon={<LayoutGrid className="h-6 w-6" />} image={result} label="2D" href="/results" /><ServiceTile icon={<LayoutGrid className="h-6 w-6" />} image={result} label="3D" href="/results" /><ServiceTile icon={<NotebookText className="h-6 w-6" />} image={dream} label="Dream" href="/dreams" /><ServiceTile icon={<WalletCards className="h-6 w-6" />} image={unit} label="Unit" onClick={() => onNavigate("units")} /></div></section><section className="mt-7 rounded-2xl border border-lime-200/25 bg-[linear-gradient(135deg,#0b6b4c,#0a875e)] p-4 shadow-[0_12px_28px_rgba(0,0,0,.12)]"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-lime-200/15 text-lime-100">{notice ? <img src={notice.imageUrl} alt={notice.altText} className="h-full w-full object-contain" /> : <Gift className="h-5 w-5" />}</span><div><p className="font-black text-white">အသိပေးချက်</p><p className="mt-1 text-sm leading-6 text-emerald-50/85">Player ID <strong className="text-white">{playerCode || displayName}</strong> ဖြင့်ဝင်ရောက်ထားသည်။ Unit ဖြည့်/နှုတ်မှုများကို Agent မှသာ စီမံနိုင်သည်။</p></div></div></section></>;
}

function QuickAction({ icon, image, label, onClick }: { icon: React.ReactNode; image?: PlayerAsset; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex min-h-20 flex-col items-center justify-center gap-2 px-1 text-center text-xs font-bold text-lime-50 hover:bg-white/[.06]"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-lime-200/45 bg-[radial-gradient(circle_at_35%_30%,#ecfccb,#bef264_48%,#65a30d)] text-[#07543e] shadow-[0_0_18px_rgba(190,242,100,.42)]">{image ? <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-contain" /> : icon}</span>{label}</button>;
}

function ServiceTile({ icon, image, label, href, onClick, muted = false }: { icon: React.ReactNode; image?: PlayerAsset; label: string; href?: string; onClick?: () => void; muted?: boolean }) {
  const content = <><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-lime-200/35 bg-white/[.06] text-lime-100">{image ? <img src={image.imageUrl} alt={image.altText} className="h-full w-full object-contain" /> : icon}</span><span className="mt-3 text-xs font-bold text-white">{label}</span>{muted ? <span className="mt-1 text-[10px] text-emerald-50/55">မကြာမီ</span> : null}</>;
  if (href) return <a href={href} className="flex min-h-30 flex-col items-center rounded-2xl border border-lime-200/30 bg-[#0a5a41] p-3 text-center shadow-[0_8px_18px_rgba(0,0,0,.1)] hover:bg-[#0c6d4e]">{content}</a>;
  return <button onClick={onClick} disabled={muted} className="flex min-h-30 flex-col items-center rounded-2xl border border-lime-200/30 bg-[#0a5a41] p-3 text-center shadow-[0_8px_18px_rgba(0,0,0,.1)] enabled:hover:bg-[#0c6d4e] disabled:cursor-default disabled:opacity-60">{content}</button>;
}

function PlayerProfile({ displayName, playerCode, balance, onNavigate, onLogout, isLoggingOut }: { displayName: string; playerCode: string | null; balance: number; onNavigate: (view: PlayerView) => void; onLogout: () => void; isLoggingOut: boolean }) {
  return <><section className="mt-7 rounded-[2rem] bg-[linear-gradient(135deg,#047857,#14b8a6)] p-6 shadow-[0_18px_45px_rgba(5,150,105,.3)]"><div className="grid h-16 w-16 place-items-center rounded-3xl border border-white/25 bg-white/10 text-white"><UserRound className="h-9 w-9" /></div><h2 className="mt-7 text-3xl font-black text-white">{displayName}</h2><p className="mt-2 text-emerald-50/75">Player account · အသုံးပြုနေသည်</p></section><section className="mt-5 rounded-[2rem] bg-white p-5 text-slate-950 shadow-[0_16px_40px_rgba(15,118,110,.13)]"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><WalletCards className="h-5 w-5" /></div><p className="font-bold">Unit လက်ကျန်</p></div><strong className="text-2xl font-black text-emerald-700">{formatUnits(balance)}</strong></div><div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm"><div className="flex items-center justify-between gap-4"><span className="text-slate-500">Player ID</span><strong>{playerCode || "—"}</strong></div><div className="mt-3 flex items-center justify-between gap-4"><span className="text-slate-500">Profile စီမံမှု</span><strong className="text-emerald-700">Agent မှသာ</strong></div></div><Button onClick={() => onNavigate("units")} className="mt-5 h-12 w-full rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800"><WalletCards className="mr-2 h-5 w-5" />Unit မှတ်တမ်းကြည့်ရန်</Button></section><button onClick={() => onNavigate("home")} className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl border border-emerald-500/35 bg-white/80 font-bold text-emerald-800 hover:bg-white"><House className="mr-2 h-5 w-5" />Player Home သို့ပြန်ရန်</button><button onClick={onLogout} disabled={isLoggingOut} className="mt-4 flex h-13 w-full items-center justify-center rounded-2xl border border-red-200 bg-white/80 font-bold text-red-600 hover:bg-red-50"><LogOut className="mr-2 h-5 w-5" />{isLoggingOut ? "ထွက်နေသည်…" : "ထွက်ရန်"}</button><p className="mt-5 text-sm leading-6 text-emerald-50/65">လုံခြုံရေးအတွက် profile အသေးစိတ်နှင့် bank information ကို Agent ကသာပြင်ဆင်နိုင်သည်။</p></>;
}

function PlayerUnits({ balance, units, isLoading, error, onRetry }: { balance: number; units: { availableUnits: number; transactions: Array<{ id: number; transactionType: "admin_issue" | "agent_transfer" | "agent_adjustment_credit" | "agent_adjustment_debit"; amount: number; fromOwnerType: "system" | "agent" | "player"; toOwnerType: "agent" | "player"; note: string | null; createdAt: Date }> } | undefined; isLoading: boolean; error: string | null; onRetry: () => void }) {
  return <><section className="mt-7 rounded-[2rem] bg-[linear-gradient(135deg,#047857,#14b8a6)] p-6 shadow-[0_18px_45px_rgba(5,150,105,.3)]"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/10 text-white"><WalletCards className="h-6 w-6" /></div><p className="mt-7 text-xs font-black uppercase tracking-[.28em] text-emerald-50/80">Internal Unit balance</p><h2 className="mt-2 text-4xl font-black text-white">{formatUnits(balance)} <span className="text-lg">Units</span></h2><p className="mt-3 text-sm text-emerald-50/80">Auto refresh · read-only Player view</p></section><section className="mt-5 rounded-[2rem] bg-white p-5 text-slate-950 shadow-[0_16px_40px_rgba(15,118,110,.13)]"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">နောက်ဆုံး Unit မှတ်တမ်း</h2><p className="mt-1 text-sm text-slate-500">Agent မှပြုလုပ်သော internal ledger entries</p></div><button onClick={onRetry} className="rounded-xl bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100" aria-label="Unit data ပြန်တင်ရန်"><RefreshCw className="h-5 w-5" /></button></div>{isLoading ? <p className="py-10 text-center text-sm text-slate-500">Unit data စစ်ဆေးနေသည်…</p> : error ? <div className="py-7 text-center"><p className="text-sm text-red-600">{error}</p><Button onClick={onRetry} variant="outline" className="mt-4 border-emerald-200 text-emerald-800">ပြန်စမ်းရန်</Button></div> : !units?.transactions.length ? <div className="py-10 text-center"><History className="mx-auto h-8 w-8 text-emerald-300" /><p className="mt-4 text-sm text-slate-500">Unit ledger မှတ်တမ်းမရှိသေးပါ။</p></div> : <div className="mt-5 divide-y divide-slate-100">{units.transactions.map(item => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate font-bold">{formatTransactionType(item.transactionType)}</p><p className="mt-1 truncate text-xs text-slate-500">{item.note || "Agent ledger update"} · {new Date(item.createdAt).toLocaleString()}</p></div><strong className={item.transactionType === "agent_adjustment_debit" ? "shrink-0 text-red-600" : "shrink-0 text-emerald-700"}>{formatTransactionDirection(item.transactionType)}{formatUnits(item.amount)}</strong></div>)}</div>}</section><p className="mt-5 text-center text-xs leading-5 text-emerald-50/60">ဤစာမျက်နှာသည် internal Unit balance ကိုသာပြသသည်။ Deposit၊ withdrawal၊ payment သို့မဟုတ် wallet transaction မပါဝင်ပါ။</p></>;
}

function BottomNavigation({ activeView, onNavigate }: { activeView: PlayerView; onNavigate: (view: PlayerView) => void }) {
  return <nav aria-label="Player bottom navigation" className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-lime-200/35 bg-[#07543e]/95 px-2 py-2 shadow-[0_16px_35px_rgba(0,0,0,.3)] backdrop-blur"><NavButton label="ပင်မ" active={activeView === "home"} onClick={() => onNavigate("home")} icon={<House className="h-5 w-5" />} /><NavButton label="Result" onClick={() => window.location.assign("/results")} icon={<LayoutGrid className="h-5 w-5" />} /><NavButton label="Unit" active={activeView === "units"} onClick={() => onNavigate("units")} icon={<WalletCards className="h-5 w-5" />} /><NavButton label="Profile" active={activeView === "profile"} onClick={() => onNavigate("profile")} icon={<UserRound className="h-5 w-5" />} /></nav>;
}

function NavButton({ label, icon, active = false, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex min-w-15 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-bold ${active ? "bg-lime-200 text-[#07543e]" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"}`}>{icon}<span>{label}</span></button>;
}

function LoadingPanel() { return <div className="grid min-h-100 place-items-center"><RefreshCw className="h-8 w-8 animate-spin text-lime-200" /></div>; }

function ErrorPanel({ label, onRetry }: { label: string; onRetry: () => void }) { return <div className="mt-12 rounded-3xl border border-red-200/25 bg-red-950/20 p-6 text-center"><p className="text-sm leading-6 text-red-100">{label}</p><Button onClick={onRetry} className="mt-5 bg-lime-200 text-[#09221c] hover:bg-lime-100">ပြန်စမ်းရန်</Button></div>; }
