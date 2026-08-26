import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QueryLoading({ label = "正在读取内容…" }: { label?: string }) {
  return <div className="golden-panel grid min-h-44 place-items-center p-8 text-center text-emerald-50/65"><div><LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-lime-200" /><p className="text-sm">{label}</p></div></div>;
}

export function QueryError({ label = "内容暂时无法读取。", onRetry }: { label?: string; onRetry?: () => void }) {
  return <div className="golden-panel grid min-h-44 place-items-center p-8 text-center"><div><AlertCircle className="mx-auto mb-3 h-6 w-6 text-amber-200" /><p className="text-sm font-semibold text-white">{label}</p><p className="mt-1 text-xs text-emerald-50/60">请稍后重试；若持续发生，请联系管理员检查发布状态。</p>{onRetry ? <Button onClick={onRetry} variant="outline" className="mt-4 border-white/15 bg-white/5 text-white hover:bg-white/10">重新加载</Button> : null}</div></div>;
}

export function QueryEmpty({ label, detail }: { label: string; detail: string }) {
  return <div className="golden-panel grid min-h-44 place-items-center p-8 text-center"><div><Inbox className="mx-auto mb-3 h-6 w-6 text-lime-200" /><p className="text-sm font-semibold text-white">{label}</p><p className="mt-1 max-w-sm text-xs leading-5 text-emerald-50/60">{detail}</p></div></div>;
}
