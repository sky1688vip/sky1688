import { ImagePlus, LoaderCircle, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminShell } from "@/components/AdminShell";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { humanizeError } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import { PLAYER_HOME_ASSET_LABELS, PLAYER_HOME_ASSET_SLOTS, type PlayerHomeAssetSlot } from "../../../shared/playerHomeAssets";
import { useAuth } from "@/_core/hooks/useAuth";

type SelectedAsset = { file: File; dataBase64: string };

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",", 2)[1] ?? "" : result);
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminPlayerAssets() {
  const { user, loading } = useAuth();
  const enabled = !loading && user?.role === "admin";
  const assets = trpc.adminPlayerAssets.list.useQuery(undefined, { enabled });
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<Partial<Record<PlayerHomeAssetSlot, SelectedAsset>>>({});
  const [altText, setAltText] = useState<Partial<Record<PlayerHomeAssetSlot, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const upload = trpc.adminPlayerAssets.upload.useMutation({
    onSuccess: async () => {
      setError(null);
      await Promise.all([utils.adminPlayerAssets.list.invalidate(), utils.playerAssets.list.invalidate()]);
    },
    onError: failure => setError(humanizeError(failure)),
  });
  const existing = useMemo(() => new Map((assets.data ?? []).map(asset => [asset.slot, asset])), [assets.data]);

  const selectFile = async (slot: PlayerHomeAssetSlot, file: File | null) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("PNG, JPEG သို့မဟုတ် WEBP image (5 MB အောက်) ကိုသာရွေးပါ။");
      return;
    }
    try {
      const dataBase64 = await toBase64(file);
      setSelected(current => ({ ...current, [slot]: { file, dataBase64 } }));
      setAltText(current => ({ ...current, [slot]: current[slot] || PLAYER_HOME_ASSET_LABELS[slot] }));
      setError(null);
    } catch {
      setError("Image file ကိုဖတ်မရပါ။ နောက်တစ်ကြိမ်ပြန်ရွေးပါ။");
    }
  };

  const submit = (slot: PlayerHomeAssetSlot) => {
    const selectedFile = selected[slot];
    if (!selectedFile) return;
    upload.mutate({ slot, altText: (altText[slot] || PLAYER_HOME_ASSET_LABELS[slot]).trim(), contentType: selectedFile.file.type as "image/png" | "image/jpeg" | "image/webp", dataBase64: selectedFile.dataBase64 });
  };

  return <AdminShell><AdminPageHeader eyebrow="PLAYER EXPERIENCE" title="Player Home ပုံများစီမံရန်" description="Player app တွင်ပြမည့် logo၊ main banner နှင့်shortcut icons များကို Admin တစ်ဦးတည်းသာ upload / replace လုပ်နိုင်သည်။ Image bytes မဟုတ်ဘဲ protected storage reference ကိုသာစနစ်ကမှတ်တမ်းတင်သည်။" />
    <section className="admin-card p-5 sm:p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lime-200" /><p className="text-sm leading-6 text-emerald-50/70">PNG, JPEG သို့မဟုတ် WEBP (5 MB အောက်) ကိုသာလက်ခံသည်။ Slot တစ်ခုကိုအသစ်တင်လျှင် Player app သည်အသစ်တင်ထားသည့်ပုံကိုချက်ချင်းအသုံးပြုမည်။ အဟောင်း asset file ကိုstorage မှဖျက်မထားဘဲ database reference ကိုသာပြောင်းမည်။</p></div>{error ? <p role="alert" className="mt-4 rounded-xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}</section>
    {assets.isLoading ? <div className="mt-7"><QueryLoading /></div> : assets.isError ? <div className="mt-7"><QueryError label="Player Home images ကိုမဖတ်နိုင်သေးပါ။" onRetry={() => assets.refetch()} /></div> : <section className="mt-7 grid gap-5 lg:grid-cols-2">{PLAYER_HOME_ASSET_SLOTS.map(slot => { const current = existing.get(slot); const file = selected[slot]?.file; const isCurrent = upload.isPending && upload.variables?.slot === slot; return <article key={slot} className="admin-card p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-lime-200">{slot.replaceAll("_", " ")}</p><h2 className="mt-2 text-lg font-black text-white">{PLAYER_HOME_ASSET_LABELS[slot]}</h2></div><ImagePlus className="h-5 w-5 shrink-0 text-emerald-50/55" /></div><div className="mt-5 grid h-40 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[#071a16]">{current ? <img src={current.imageUrl} alt={current.altText} className="h-full w-full object-contain" /> : <p className="text-center text-sm text-emerald-50/45">Default design icon ကိုအသုံးပြုနေသည်</p>}</div><div className="mt-5 grid gap-3"><div><Label htmlFor={`asset-${slot}`}>Image file</Label><Input id={`asset-${slot}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void selectFile(slot, event.target.files?.[0] ?? null)} className="admin-input mt-2 cursor-pointer" /></div><div><Label htmlFor={`asset-alt-${slot}`}>Player အတွက် image description</Label><Input id={`asset-alt-${slot}`} value={altText[slot] ?? current?.altText ?? PLAYER_HOME_ASSET_LABELS[slot]} onChange={event => setAltText(currentAlt => ({ ...currentAlt, [slot]: event.target.value }))} className="admin-input mt-2" maxLength={180} /></div>{file ? <p className="text-xs text-emerald-50/60">ရွေးထားသော file: {file.name}</p> : null}<Button disabled={!file || isCurrent} onClick={() => submit(slot)} className="mt-1 bg-lime-200 text-[#09221c] hover:bg-lime-100">{isCurrent ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />တင်နေသည်…</> : <><Upload className="mr-2 h-4 w-4" />ဒီ slot ကိုအစားထိုးတင်ရန်</>}</Button></div></article>; })}</section>}
  </AdminShell>;
}
