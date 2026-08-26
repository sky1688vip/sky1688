import { Link, useRoute } from "wouter";
import { ArrowLeft, Sparkles, Tags } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/QueryState";
import { trpc } from "@/lib/trpc";

export default function DreamDetail() {
  const [, params] = useRoute("/dreams/:slug");
  const slug = params?.slug ?? "";
  const query = trpc.content.dreams.detail.useQuery({ slug }, { enabled: Boolean(slug) });
  return <PublicShell><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-18"><Link href="/dreams" className="inline-flex items-center gap-2 text-sm font-semibold text-lime-200 hover:text-lime-100"><ArrowLeft className="h-4 w-4" />返回 Dream1000</Link><div className="mt-8">{query.isLoading ? <QueryLoading /> : query.isError ? <QueryError onRetry={() => query.refetch()} /> : !query.data ? <QueryEmpty label="找不到该梦境" detail="该条目可能尚未发布、已下架，或链接已失效。" /> : <article className="golden-panel overflow-hidden"><div className="relative min-h-48 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_40%_0%,rgba(184,255,80,.48),transparent_38%),linear-gradient(135deg,#0b4638,#0d897a)] p-8"><div className="absolute right-9 top-7 grid h-28 w-28 place-items-center rounded-full border border-white/25 bg-white/10 shadow-[0_0_70px_rgba(187,255,101,.38)]"><Sparkles className="h-10 w-10 text-white" /></div><p className="relative z-10 text-sm font-semibold text-lime-100">{query.data.categoryName ?? "Dream1000"}</p><h1 className="relative z-10 mt-3 max-w-xl text-3xl font-black text-white sm:text-4xl">{query.data.title}</h1></div><div className="p-7 sm:p-10"><div className="inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-sm font-bold text-lime-100"><Tags className="h-4 w-4" />幸运数字：{query.data.luckyNumbers}</div><p className="mt-7 text-lg leading-8 text-emerald-50/80">{query.data.summary}</p><div className="mt-8 border-l-2 border-lime-200/70 pl-5 text-base leading-8 text-emerald-50/68"><p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-200">释义</p><p className="mt-3 whitespace-pre-wrap">{query.data.meaning}</p></div></div></article>}</div></section></PublicShell>;
}
