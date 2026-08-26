import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicShell } from "@/components/PublicShell";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/QueryState";
import { trpc } from "@/lib/trpc";

export default function Dreams() {
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const categories = trpc.content.dreams.categories.useQuery();
  const input = useMemo(() => ({ search: search.trim() || undefined, categorySlug, limit: 30 }), [search, categorySlug]);
  const dreams = trpc.content.dreams.list.useQuery(input);
  return <PublicShell><section className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:pt-16"><div className="dream-hero overflow-hidden rounded-[2rem] border border-lime-200/15 p-7 sm:p-10"><div className="relative z-10 max-w-2xl"><p className="eyebrow">DREAM 1000</p><h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">把梦境与<span className="text-lime-200">幸运数字</span>留在同一页</h1><p className="mt-5 text-base leading-7 text-emerald-50/70">按关键词、数字或分类筛选已发布的 Dream1000 条目。每一张卡片都通向完整的释义内容。</p><div className="relative mt-7 max-w-xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lime-200" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索梦境、释义或幸运数字" className="h-12 border-white/10 bg-[#061712]/70 pl-11 text-white placeholder:text-emerald-50/35" /></div></div><div className="dream-orb" aria-hidden="true"><Sparkles className="h-12 w-12 text-lime-100" /></div></div>
    <div className="mt-7 flex flex-wrap gap-2"><Button onClick={() => setCategorySlug(undefined)} className={!categorySlug ? "bg-lime-200 text-[#09221c] hover:bg-lime-100" : "border border-white/10 bg-white/[0.04] text-emerald-50/75 hover:bg-white/10 hover:text-white"}>全部</Button>{categories.data?.map(category => <Button key={category.id} onClick={() => setCategorySlug(category.slug)} className={categorySlug === category.slug ? "bg-lime-200 text-[#09221c] hover:bg-lime-100" : "border border-white/10 bg-white/[0.04] text-emerald-50/75 hover:bg-white/10 hover:text-white"}>{category.name}</Button>)}</div>
    <div className="mt-8">{dreams.isLoading ? <QueryLoading label="正在检索 Dream1000…" /> : dreams.isError ? <QueryError label="Dream1000 数据无法读取。" onRetry={() => dreams.refetch()} /> : !dreams.data?.length ? <QueryEmpty label="没有匹配的已发布梦境" detail="尝试修改关键词或分类；管理员发布条目后会自动出现在这里。" /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{dreams.data.map((dream, index) => <Link key={dream.id} href={`/dreams/${dream.slug}`} className="golden-card group overflow-hidden"><div className={`dream-card-top dream-shade-${(index % 4) + 1}`}><div className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#06231b]/35 px-2.5 py-1 text-[11px] font-bold text-white">{dream.categoryName ?? "Dream1000"}</div><Sparkles className="absolute bottom-5 left-1/2 h-8 w-8 -translate-x-1/2 text-white/90" /></div><div className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-200">LUCKY · {dream.luckyNumbers}</p><span className="text-emerald-50/40 transition-transform group-hover:translate-x-1">→</span></div><h2 className="mt-3 text-lg font-black text-white">{dream.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-emerald-50/58">{dream.summary}</p></div></Link>)}</div>}</div>
  </section></PublicShell>;
}
