import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";

export function AdminPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-3 text-3xl font-black text-white">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/60">{description}</p></div><Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-lime-200 hover:text-lime-100">查看公开站点 <ArrowUpRight className="h-4 w-4" /></Link></div>;
}
