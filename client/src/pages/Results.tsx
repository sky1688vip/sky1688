import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/PublicShell";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/QueryState";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

const tabs = [
  { id: "all", label: "全部结果" },
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
] as const;

export default function Results() {
  const [gameType, setGameType] = useState<(typeof tabs)[number]["id"]>("all");
  const input = useMemo(() => ({ gameType: gameType === "all" ? undefined : gameType, limit: 24 }), [gameType]);
  const query = trpc.content.results.list.useQuery(input);

  return <PublicShell><section className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:pt-16">
    <div className="max-w-3xl"><p className="eyebrow">LIVE RESULT BOARD</p><h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">2D / 3D <span className="text-lime-200">结果中心</span></h1><p className="mt-5 text-base leading-7 text-emerald-50/65">只展示已由管理员审核并发布的结果。每一次更新都在后台留有完整的发布时间与状态控制。</p></div>
    <div className="mt-9 flex flex-wrap gap-2">{tabs.map(tab => <Button key={tab.id} onClick={() => setGameType(tab.id)} className={gameType === tab.id ? "bg-lime-200 text-[#09221c] hover:bg-lime-100" : "border border-white/10 bg-white/[0.04] text-emerald-50/75 hover:bg-white/10 hover:text-white"}>{tab.label}</Button>)}</div>
    <div className="mt-8">{query.isLoading ? <QueryLoading label="正在同步最新已发布结果…" /> : query.isError ? <QueryError label="结果数据无法读取。" onRetry={() => query.refetch()} /> : !query.data?.length ? <QueryEmpty label="尚无已发布结果" detail="管理员发布 2D 或 3D 结果后，内容将自动出现在这里。" /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data.map(result => <Link key={result.id} href={`/results/${result.id}`} className="golden-card group p-5"><div className="flex items-start justify-between gap-4"><Badge className={result.gameType === "2d" ? "bg-lime-200 text-[#09221c]" : "bg-cyan-200 text-[#09221c]"}>{result.gameType.toUpperCase()}</Badge><span className="inline-flex items-center gap-1 text-xs text-emerald-50/50"><CalendarDays className="h-3.5 w-3.5" />{formatDate(result.drawAt)}</span></div><div className="mt-8 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-50/75">{result.title}</p><div className="mt-2 font-display text-5xl font-black tracking-[0.14em] text-white">{result.resultNumber}</div></div><ChevronRight className="h-5 w-5 text-lime-200 transition-transform group-hover:translate-x-1" /></div>{result.note ? <p className="mt-5 line-clamp-2 text-sm leading-6 text-emerald-50/55">{result.note}</p> : null}</Link>)}</div>}</div>
  </section></PublicShell>;
}
