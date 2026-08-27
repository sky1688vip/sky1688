import { MoonStar } from "lucide-react";

export function SkyMark({ compact = false, imageUrl }: { compact?: boolean; imageUrl?: string }) {
  if (imageUrl) {
    return <div className="flex h-11 items-center" aria-label="SKY1688 Player logo"><img src={imageUrl} alt="SKY1688" className="h-11 max-w-40 object-contain object-left" /></div>;
  }
  return (
    <div className="flex items-center gap-3" aria-label="SKY1688">
      <div className="grid h-10 w-10 overflow-hidden place-items-center rounded-2xl border border-lime-200/25 bg-lime-300/10 text-lime-200 shadow-[0_0_30px_rgba(184,255,80,0.18)]">
        <MoonStar className="h-5 w-5" strokeWidth={1.8} />
      </div>
      {!compact ? (
        <div className="leading-none">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-200/80">Golden Money</div>
          <div className="mt-1 text-base font-black tracking-tight text-white">SKY1688</div>
        </div>
      ) : null}
    </div>
  );
}
