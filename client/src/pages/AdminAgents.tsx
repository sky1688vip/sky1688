import { Copy, ShieldAlert, UserPlus, UserRoundX } from "lucide-react";
import { useState } from "react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminShell } from "@/components/AdminShell";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type AgentForm = { fullName: string; email: string; phone: string };
const blankAgent = (): AgentForm => ({ fullName: "", email: "", phone: "" });

export default function AdminAgents() {
  const { user, loading } = useAuth();
  const canQueryAdmin = !loading && user?.role === "admin";
  const utils = trpc.useUtils();
  const agents = trpc.adminAgents.list.useQuery(undefined, { enabled: canQueryAdmin });
  const [form, setForm] = useState<AgentForm>(blankAgent);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ fullName: string; agentCode: string; activationCode: string; activationExpiresAt: Date } | null>(null);
  const create = trpc.adminAgents.create.useMutation({
    onSuccess: result => {
      setIssued({ fullName: form.fullName, ...result });
      setForm(blankAgent());
      setError(null);
      utils.adminAgents.list.invalidate();
    },
    onError: failure => setError(humanizeError(failure)),
  });
  const suspend = trpc.adminAgents.suspend.useMutation({
    onSuccess: () => { setError(null); utils.adminAgents.list.invalidate(); },
    onError: failure => setError(humanizeError(failure)),
  });
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(null); setIssued(null); create.mutate({ fullName: form.fullName, email: form.email, phone: form.phone || undefined }); };
  const copy = async () => { if (!issued) return; await navigator.clipboard.writeText(issued.activationCode); };

  return <AdminShell><AdminPageHeader eyebrow="AGENT PROVISIONING" title="Agent 账户管理" description="仅管理员可创建邀请。Agent 必须使用相同的 Manus 邮箱登录，再用一次性代码完成激活。" />
    <section className="admin-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-white">创建 Agent 邀请</h2><p className="mt-1 text-sm text-emerald-50/55">系统不会自动发送激活码；创建后请由管理员通过受控渠道交给指定人员。</p></div><UserPlus className="h-5 w-5 text-lime-200" /></div>
      {error ? <p className="mt-4 rounded-lg border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}
      <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-3"><div><Label>Agent 姓名</Label><Input required value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} className="admin-input mt-2" placeholder="例如：Aung Min" /></div><div><Label>Manus 登录邮箱</Label><Input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="admin-input mt-2" placeholder="agent@example.com" /></div><div><Label>联系电话（可选）</Label><Input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="admin-input mt-2" placeholder="0912345678" /></div><div className="md:col-span-3"><Button disabled={create.isPending} className="bg-lime-200 text-[#09221c] hover:bg-lime-100">{create.isPending ? "正在创建…" : "创建邀请并生成激活码"}</Button></div></form>
    </section>
    {issued ? <section className="mt-7 border border-lime-200/35 bg-lime-200/10 p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><div><h2 className="font-bold text-white">{issued.fullName} 的一次性激活信息</h2><p className="mt-1 text-sm leading-6 text-emerald-50/70">此代码仅在当前管理员会话中显示。请通过安全渠道提供给与受邀邮箱一致的 Manus 用户；有效期至 {formatDate(issued.activationExpiresAt)}。</p><div className="mt-4 flex flex-wrap items-center gap-3"><code className="border border-lime-200/35 bg-[#071a16] px-4 py-2 font-mono text-base font-bold tracking-[.12em] text-lime-100">{issued.activationCode}</code><Button size="sm" variant="outline" onClick={copy} className="admin-action"><Copy className="mr-1.5 h-3.5 w-3.5" />复制代码</Button><span className="text-sm text-emerald-50/55">Agent code: <strong className="text-white">{issued.agentCode}</strong></span></div></div></div></section> : null}
    <section className="mt-7">{agents.isLoading ? <QueryLoading /> : agents.isError ? <QueryError label="无法读取 Agent 列表。" onRetry={() => agents.refetch()} /> : !agents.data?.length ? <QueryEmpty label="尚未创建 Agent 邀请" detail="使用上方表单创建首个受控 Agent 账户；未激活账户不会获得 Agent 权限。" /> : <div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1.1fr_1fr_.8fr_.8fr_1fr] gap-3 bg-white/[.045] px-5 py-3 text-xs font-bold uppercase tracking-wider text-emerald-50/45"><span>Agent</span><span>邮箱 / 代码</span><span>状态</span><span>创建时间</span><span>操作</span></div>{agents.data.map(({ agent, activatedUserName }) => <div key={agent.id} className="grid grid-cols-1 gap-4 border-t border-white/8 px-5 py-5 text-sm md:grid-cols-[1.1fr_1fr_.8fr_.8fr_1fr] md:items-center"><div><p className="font-bold text-white">{agent.fullName}</p><p className="mt-1 text-xs text-emerald-50/50">{activatedUserName ? `已关联：${activatedUserName}` : "等待 Manus 激活"}</p></div><div><p className="text-emerald-50/75">{agent.email}</p><p className="mt-1 font-mono text-xs tracking-[.1em] text-lime-100">{agent.agentCode}</p></div><p><span className={`status-pill status-${agent.status === "active" ? "published" : agent.status === "invited" ? "draft" : "archived"}`}>{agent.status === "active" ? "已激活" : agent.status === "invited" ? "待激活" : "已停用"}</span></p><p className="text-emerald-50/60">{formatDate(agent.createdAt)}</p><div>{agent.status !== "suspended" ? <Button size="sm" variant="outline" disabled={suspend.isPending} onClick={() => suspend.mutate({ id: agent.id })} className="admin-action"><UserRoundX className="mr-1.5 h-3.5 w-3.5" />停用</Button> : <span className="text-xs text-emerald-50/40">不可直接恢复</span>}</div></div>)}</div>}</section>
  </AdminShell>;
}
