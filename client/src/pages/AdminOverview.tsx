import { BookOpenText, Database, RadioTower } from "lucide-react";
import type { ComponentType } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const metrics: Array<{ label: string; Icon: ComponentType<{ className?: string }> }> = [
  { label: "结果记录", Icon: RadioTower },
  { label: "Dream1000 条目", Icon: BookOpenText },
  { label: "梦境分类", Icon: Database },
];

export default function AdminOverview() {
  const { user, loading } = useAuth();
  const overview = trpc.adminContent.overview.useQuery(undefined, { enabled: !loading && user?.role === "admin" });
  return <AdminShell><AdminPageHeader eyebrow="CONTROL ROOM" title="SKY1688 内容后台" description="这里管理公开站点上可见的 2D/3D 结果与 Dream1000 内容。每项写入都要求 Manus 登录和管理员权限。" />
    {overview.isLoading ? <QueryLoading label="正在读取内容总览…" /> : overview.isError ? <QueryError label="无法读取后台总览。" onRetry={() => overview.refetch()} /> : <div className="grid gap-4 md:grid-cols-3">{metrics.map(({ label, Icon }) => { const value = label === "结果记录" ? overview.data?.results ?? 0 : label === "Dream1000 条目" ? overview.data?.dreams ?? 0 : overview.data?.categories ?? 0; return <div key={label} className="admin-card p-6"><Icon className="h-6 w-6 text-lime-200" /><p className="mt-8 text-sm font-semibold text-emerald-50/65">{label}</p><p className="mt-2 font-display text-4xl font-black text-white">{value}</p></div>; })}</div>}
    <div className="admin-card mt-7 p-6"><p className="text-sm font-bold text-white">上线前内容流</p><div className="mt-5 grid gap-3 text-sm text-emerald-50/65 md:grid-cols-4">{["建立分类与条目草稿", "校对数字、释义和来源", "通过后台发布到公开 API", "检查公开端显示与权限"].map((step, index) => <div key={step} className="rounded-xl border border-white/10 bg-black/10 p-4"><span className="font-display text-lg text-lime-200">0{index + 1}</span><p className="mt-2 leading-6">{step}</p></div>)}</div></div>
  </AdminShell>;
}
