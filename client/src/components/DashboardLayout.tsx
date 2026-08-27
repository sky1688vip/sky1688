import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { BookOpenText, ImagePlus, LayoutDashboard, LogOut, PanelLeft, RadioTower, UserPlus } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { SkyMark } from "./SkyMark";

const menuItems = [
  { icon: LayoutDashboard, label: "内容总览", path: "/admin" },
  { icon: RadioTower, label: "2D / 3D 结果", path: "/admin/results" },
  { icon: BookOpenText, label: "Dream1000", path: "/admin/dreams" },
  { icon: UserPlus, label: "Agent 账户", path: "/admin/agents" },
  { icon: ImagePlus, label: "Player ပုံများ", path: "/admin/player-assets" },
];
const SIDEBAR_WIDTH_KEY = "sky1688-sidebar-width"; const DEFAULT_WIDTH = 272; const MIN_WIDTH = 224; const MAX_WIDTH = 440;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH); const { loading, user } = useAuth();
  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)); }, [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="admin-guard"><div className="golden-panel max-w-md p-8 text-center"><h1 className="text-2xl font-black text-white">请先登录</h1><p className="mt-3 text-sm text-emerald-50/65">后台访问需要 Manus 登录。</p><Button onClick={() => startLogin()} className="mt-6 bg-lime-200 text-[#09221c] hover:bg-lime-100">使用 Manus 登录</Button></div></div>;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardContent setSidebarWidth={setSidebarWidth}>{children}</DashboardContent></SidebarProvider>;
}

function DashboardContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation(); const { state, toggleSidebar } = useSidebar(); const isCollapsed = state === "collapsed"; const [isResizing, setIsResizing] = useState(false); const sidebarRef = useRef<HTMLDivElement>(null); const isMobile = useIsMobile();
  useEffect(() => { const move = (event: MouseEvent) => { if (!isResizing) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = event.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); }; const up = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); document.body.style.cursor = "col-resize"; } return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); document.body.style.cursor = ""; }; }, [isResizing, setSidebarWidth]);
  return <><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r border-white/10 bg-[#09241d] text-white" disableTransition={isResizing}><SidebarHeader className="h-[78px] justify-center border-b border-white/8 px-3"><div className="flex w-full items-center gap-2"><button onClick={toggleSidebar} className="grid h-9 w-9 place-items-center rounded-xl text-emerald-50/60 hover:bg-white/8 hover:text-white"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed ? <SkyMark /> : null}</div></SidebarHeader><SidebarContent className="gap-0 px-2 py-4"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-50/38 group-data-[collapsible=icon]:hidden">管理中心</p><SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl text-emerald-50/65 hover:bg-white/8 hover:text-white data-[active=true]:bg-lime-200 data-[active=true]:text-[#09221c]"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="border-t border-white/8 p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/8"><Avatar className="h-9 w-9 border border-white/10"><AvatarFallback className="bg-lime-200/10 text-xs font-bold text-lime-100">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-bold text-white">{user?.name || "管理员"}</p><p className="mt-1 truncate text-xs text-emerald-50/45">Manus 管理员</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive"><LogOut className="mr-2 h-4 w-4" />退出登录</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} /></div><SidebarInset className="min-h-screen bg-[#071a16] text-white">{isMobile ? <div className="sticky top-0 z-20 flex h-14 items-center border-b border-white/10 bg-[#071a16]/90 px-3 backdrop-blur"><SidebarTrigger className="text-white" /><span className="ml-3 text-sm font-bold">SKY1688 后台</span></div> : null}<main className="min-h-screen p-4 sm:p-7 lg:p-10">{children}</main></SidebarInset></>;
}
