import { Link } from "wouter";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { QueryLoading } from "./QueryState";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#071a16] p-5"><QueryLoading label="正在核验后台权限…" /></div>;
  if (!user) return <div className="admin-guard"><div className="golden-panel max-w-md p-8 text-center"><LockKeyhole className="mx-auto h-9 w-9 text-lime-200" /><h1 className="mt-5 text-2xl font-black text-white">管理员后台需要登录</h1><p className="mt-3 text-sm leading-6 text-emerald-50/65">请使用 Manus 登录。系统将在服务端和界面层同时验证管理员角色。</p><Button onClick={() => startLogin()} className="mt-6 w-full bg-lime-200 text-[#09221c] hover:bg-lime-100">使用 Manus 登录</Button><Link href="/" className="mt-4 block text-sm font-semibold text-lime-200">返回公开站点</Link></div></div>;
  if (user.role !== "admin") return <div className="admin-guard"><div className="golden-panel max-w-md p-8 text-center"><ShieldAlert className="mx-auto h-9 w-9 text-amber-200" /><h1 className="mt-5 text-2xl font-black text-white">无管理员权限</h1><p className="mt-3 text-sm leading-6 text-emerald-50/65">当前 Manus 账户已登录，但未被授予 SKY1688 内容管理员权限。写入接口同样会拒绝本次访问。</p><Link href="/"><Button variant="outline" className="mt-6 border-white/15 bg-white/5 text-white hover:bg-white/10">返回公开站点</Button></Link></div></div>;
  return <DashboardLayout>{children}</DashboardLayout>;
}
