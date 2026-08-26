import { Link, useRoute } from "wouter";
import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PublicShell } from "@/components/PublicShell";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/QueryState";
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export default function ResultDetail() {
  const [, params] = useRoute("/results/:id");
  const id = Number(params?.id);
  const query = trpc.content.results.detail.useQuery({ id }, { enabled: Number.isInteger(id) && id > 0 });
  return <PublicShell><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-18"><Link href="/results" className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200 hover:text-lime-100"><ArrowLeft className="h-4 w-4" />返回结果中心</Link><div className="mt-8">{query.isLoading ? <QueryLoading /> : query.isError ? <QueryError onRetry={() => query.refetch()} /> : !query.data ? <QueryEmpty label="找不到该结果" detail="该记录可能尚未发布、已下架，或链接已失效。" /> : <article className="golden-panel overflow-hidden p-7 sm:p-10"><div className="flex flex-wrap items-center justify-between gap-4"><Badge className={query.data.gameType === "2d" ? "bg-lime-200 text-[#09221c]" : "bg-cyan-200 text-[#09221c]"}>{query.data.gameType.toUpperCase()} 已发布</Badge><span className="inline-flex items-center gap-2 text-sm text-emerald-50/60"><CalendarDays className="h-4 w-4" />{formatDate(query.data.drawAt)}</span></div><p className="mt-10 text-sm font-semibold text-emerald-50/70">{query.data.title}</p><h1 className="mt-3 font-display text-6xl font-black tracking-[0.16em] text-white sm:text-8xl">{query.data.resultNumber}</h1>{query.data.note ? <p className="mt-9 max-w-2xl text-base leading-8 text-emerald-50/70">{query.data.note}</p> : null}<div className="mt-10 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-emerald-50/55"><ShieldCheck className="h-5 w-5 text-lime-200" />该条目由受保护后台发布。</div></article>}</div></section></PublicShell>;
}
