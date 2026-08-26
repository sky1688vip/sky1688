import { useState } from "react";
import { BadgeCheck, ShieldCheck, UserRoundPlus } from "lucide-react";
import { startLogin } from "@/const";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/button";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PlayerActivation() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const activation = trpc.accounts.player.activate.useMutation({ onSuccess: () => { setError(null); window.location.assign("/player"); }, onError: failure => setError(humanizeError(failure)) });
  return <PublicShell><div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16"><p className="eyebrow">PLAYER ONBOARDING</p><h1 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">激活你的<br /><span className="text-lime-200">Player 账户</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/65">激活会为当前 Manus 身份建立一个 Player profile，用于访问已审核的 SKY1688 公开内容。此流程不处理钱包、支付、转账或投注。</p>
    <section className="golden-panel mt-10 p-6 sm:p-8">{loading ? <p className="text-sm text-emerald-50/65">正在确认登录状态…</p> : !user ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">先登录，再激活</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Player profile 绑定到你当前的 Manus 登录身份。</p><Button onClick={() => startLogin()} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">使用 Manus 登录</Button></div> : user.role === "agent" ? <div className="text-center"><BadgeCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">此账号已是 Agent</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">Agent 和 Player 身份保持分离。请使用未激活为 Agent 的 Manus 账号创建 Player profile。</p></div> : user.role === "admin" ? <div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">管理员不使用 Player onboarding</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">请以普通用户身份登录来体验 Player 页面。</p></div> : <div className="text-center"><UserRoundPlus className="mx-auto h-8 w-8 text-lime-200" /><h2 className="mt-4 text-xl font-black text-white">确认创建 Player profile</h2><p className="mt-2 text-sm leading-6 text-emerald-50/65">创建后可在 Player 页面进入已审核的 2D / 3D 结果和 Dream1000 内容。</p>{error ? <p className="mt-5 border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}<Button disabled={activation.isPending} onClick={() => { setError(null); activation.mutate(); }} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">{activation.isPending ? "正在激活…" : "创建并激活 Player profile"}</Button></div>}</section></div></PublicShell>;
}
