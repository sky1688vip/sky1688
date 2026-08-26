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
  const activation = trpc.accounts.agent.activate.useMutation({ onSuccess: () => { setError(null); setActivationCode(""); window.location.assign("/agent"); }, onError: failure => setError(humanizeError(failure)) });
  const submit = (event: FormEvent) => { event.preventDefault(); setError(null); activation.mutate({ activationCode }); };
  return <PublicShell><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16"><p className="eyebrow">AGENT ACTIVATION</p><h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">激活你的<br /><span className="text-lime-200">Agent 账户</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/65">只有管理员创建的邀请可激活。请使用与邀请邮箱相同的 Manus 账号登录，并输入管理员安全提供的一次性代码。</p>
    <section className="golden-panel mt-10 p-6 sm:p-8">{loading ? <p className="text-sm text-emerald-50/65">正在确认登录状态…</p> : !user ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">先登录，再激活</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">系统会校验你当前 Manus 邮箱是否与管理员邀请中的邮箱一致。</p><Button onClick={() => startLogin()} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">使用 Manus 登录</Button></div> : user.role === "agent" ? <div className="text-center"><BadgeCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">Agent 已激活</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">此账号已经是 Agent；可进入后台查看被授权的功能。</p><a href="/admin" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">进入后台</a></div> : user.role === "admin" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">管理员无需激活</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">请在后台的 Agent 账户页面创建邀请并管理激活状态。</p><a href="/admin/agents" className="mt-6 inline-flex h-10 items-center justify-center bg-lime-200 px-4 text-sm font-bold text-[#09221c]">管理 Agent 邀请</a></div> : <form onSubmit={submit}><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><div><h2 className="font-bold text-white">输入一次性激活码</h2><p className="mt-1 text-sm leading-6 text-emerald-50/60">激活后，此 Manus 账号将被标记为 Agent；代码过期、已使用或邮箱不匹配时会被拒绝。</p></div></div>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<div className="mt-6"><Label>激活码</Label><Input required value={activationCode} onChange={event => setActivationCode(event.target.value.toUpperCase())} className="admin-input mt-2 font-mono tracking-[.14em]" placeholder="SKY-XXXXXXXXXX" /></div><Button disabled={activation.isPending} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">{activation.isPending ? "正在验证…" : "验证并激活 Agent"}</Button></form>}</section></div></PublicShell>;
}
