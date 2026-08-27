import React from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, LayoutDashboard, Menu, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkyMark } from "./SkyMark";

const links = [
  { href: "/", label: "ပင်မ" },
  { href: "/results", label: "2D / 3D" },
  { href: "/dreams", label: "Dream1000" },
  { href: "/player", label: "Player" },
];

export function PublicShell({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "player" }) {
  const [location] = useLocation();
  const playerVariant = variant === "player";

  return (
    <div className="min-h-screen overflow-x-clip bg-[#071a16] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70" aria-hidden="true">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="star-field" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/7 bg-[#071a16]/80 backdrop-blur-xl">
        <div className={`mx-auto flex h-[76px] max-w-7xl items-center gap-5 px-4 sm:px-6 ${playerVariant ? "justify-start" : "justify-between"}`}>
          <Link href="/" className="shrink-0"><SkyMark /></Link>
          {!playerVariant ? <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.035] p-1 md:flex" aria-label="အဓိက လမ်းညွှန်">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  location === link.href ? "bg-lime-200 text-[#09221c]" : "text-emerald-50/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav> : null}
          {!playerVariant ? <div className="flex items-center gap-2">
            <Link href="/admin" className="hidden sm:block">
              <Button variant="outline" className="border-white/15 bg-white/[0.035] text-emerald-50 hover:bg-white/10 hover:text-white">
                <LayoutDashboard className="mr-2 h-4 w-4" /> စီမံခန့်ခွဲမှု
              </Button>
            </Link>
            <Link href="/dreams" className="sm:hidden" aria-label="Dream1000 ဖွင့်ရန်">
              <Button size="icon" variant="outline" className="border-white/15 bg-white/[0.035] text-white"><Menu className="h-4 w-4" /></Button>
            </Link>
          </div> : null}
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 border-t border-white/8 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-emerald-50/55 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2"><MoonStar className="h-4 w-4 text-lime-200" /> SKY1688 · စစ်ဆေးအတည်ပြုပြီးသောအချက်အလက်များကိုသာ ထုတ်ပြန်သည်</div>
          {!playerVariant ? <div className="flex items-center gap-1 text-emerald-50/45">Golden Money Player ဝန်ဆောင်မှု <ArrowUpRight className="h-3.5 w-3.5" /></div> : null}
        </div>
      </footer>
    </div>
  );
}
