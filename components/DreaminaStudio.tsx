"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles, Shirt, Wand2, Upload, ChevronLeft, ChevronRight,
  RotateCcw, Loader2, AlertCircle, History, Trash2, Download,
  ZoomIn, Camera, X, Plus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string; personImage: string; clothImage: string; resultBase64: string; modelUsed: string; timestamp: number;
}
interface ClothItem { id: string; dataUrl: string; }

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try { const d = localStorage.getItem("tryon-history"); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveHistory(items: HistoryItem[]) {
  try { localStorage.setItem("tryon-history", JSON.stringify(items.slice(0, 20))); } catch {}
}
let cid = 0;
const nid = () => `c${++cid}_${Date.now()}`;

export default function DreaminaStudio() {
  const { t } = useI18n();
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothItems, setClothItems] = useState<ClothItem[]>([]);
  const [selectedClothId, setSelectedClothId] = useState<string | null>(null);
  const selectedCloth = clothItems.find((c) => c.id === selectedClothId);
  const clothImage = selectedCloth?.dataUrl || null;
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showZoom, setShowZoom] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<"person" | "cloth" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const pi = useRef<HTMLInputElement>(null);
  const ci = useRef<HTMLInputElement>(null);
  const cr = useRef<HTMLDivElement>(null);
  const vr = useRef<HTMLVideoElement>(null);
  const cc = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const hp = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { const r = new FileReader(); r.onload = () => { setPersonImage(r.result as string); setShowResult(false); setResultImage(null); }; r.readAsDataURL(f); }
  }, []);
  const hc = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files; if (!f?.length) return;
    Array.from(f).forEach((fl) => { const r = new FileReader(); const id = nid(); r.onload = () => { setClothItems((p) => [...p, { id, dataUrl: r.result as string }]); setSelectedClothId((p) => p || id); setShowResult(false); setResultImage(null); }; r.readAsDataURL(fl); });
  }, []);

  const oc = useCallback(async (target: "person" | "cloth") => {
    setCameraTarget(target); setCameraReady(false); setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      setCameraStream(s);
      setTimeout(() => { if (vr.current) { vr.current.srcObject = s; vr.current.onplaying = () => setCameraReady(true); vr.current.play(); } }, 50);
    } catch (err: any) { setError(err.message?.includes("Permission") ? t("camera.permission") : t("camera.error")); setCameraTarget(null); }
  }, [t]);

  const cp = useCallback(() => {
    const v = vr.current, c = cc.current;
    if (!v || !c || !cameraStream) return;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0, c.width, c.height);
    const d = c.toDataURL("image/jpeg", 0.9);
    if (cameraTarget === "person") setPersonImage(d);
    else { const id = nid(); setClothItems((p) => [...p, { id, dataUrl: d }]); setSelectedClothId(id); }
    setShowResult(false); setResultImage(null); clc();
  }, [cameraTarget, cameraStream]);
  const clc = useCallback(() => {
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    setCameraStream(null); setCameraTarget(null); setCameraReady(false);
    if (vr.current) vr.current.srcObject = null;
  }, [cameraStream]);
  const rm = useCallback((id: string) => {
    setClothItems((p) => { const n = p.filter((c) => c.id !== id); if (selectedClothId === id) setSelectedClothId(n[0]?.id || null); return n; });
    setShowResult(false); setResultImage(null);
  }, [selectedClothId]);

  const hto = async () => {
    if (!personImage || !clothImage) { setError(t("studio.error.upload")); return; }
    setLoading(true); setError(null); setShowResult(false); setResultImage(null); setModelUsed(null);
    try {
      const res = await fetch("/api/try-on", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "outfit", personImageBase64: personImage, clothImageBase64: clothImage }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const ru = data.resultBase64 ? `data:image/jpeg;base64,${data.resultBase64}` : data.resultImageUrl;
      setResultImage(ru); setModelUsed(data.modelUsed); setShowResult(true); setSliderPos(50);
      const ni: HistoryItem = { id: Date.now().toString(), personImage, clothImage, resultBase64: data.resultBase64 || "", modelUsed: data.modelUsed || "unknown", timestamp: Date.now() };
      const uh = [ni, ...loadHistory()]; saveHistory(uh); setHistory(uh);
    } catch (err: any) { setError(err.message || "Error"); }
    finally { setLoading(false); }
  };
  const hr = () => { setPersonImage(null); setClothItems([]); setSelectedClothId(null); setResultImage(null); setShowResult(false); setError(null); setModelUsed(null); setSliderPos(50); };
  const hd = () => { if (!resultImage) return; const a = document.createElement("a"); a.href = resultImage; a.download = `fitai-${Date.now()}.jpg`; a.click(); };
  const ch = () => { saveHistory([]); setHistory([]); };
  const uhf = (item: HistoryItem) => { setPersonImage(item.personImage); setClothItems([{ id: nid(), dataUrl: item.clothImage }]); setSelectedClothId(null); setResultImage(item.resultBase64 ? `data:image/jpeg;base64,${item.resultBase64}` : null); setShowResult(!!item.resultBase64); setShowHistory(false); };
  const hsm = (e: React.MouseEvent) => {
    e.preventDefault(); const c = cr.current; if (!c) return;
    const mv = (e: MouseEvent) => { const r = c.getBoundingClientRect(); setSliderPos(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100); };
    const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      {cameraTarget && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md">
            <video ref={vr} className="w-full rounded-2xl bg-black" playsInline muted />
            <canvas ref={cc} className="hidden" />
            {!cameraReady && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-white" /></div>}
          </div>
          <div className="flex gap-4 mt-6">
            <button onClick={clc} className="px-6 py-3 rounded-xl bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition"><X size={18} className="inline mr-1" /> {t("camera.cancel")}</button>
            <button onClick={cp} disabled={!cameraReady} className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-40 transition">{t("camera.capture")}</button>
          </div>
          <p className="text-zinc-400 text-sm mt-3">{cameraReady ? t("camera.ready") : t("camera.loading")}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 animate-slide-up">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Shirt size={22} className="text-violet-600" /> {t("studio.title")}
          <span className="tag tag-violet text-[10px]">{t("studio.free")}</span>
        </h2>
        <button onClick={() => setShowHistory(!showHistory)}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all", showHistory ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
          <History size={16} /> {t("studio.history")}
          {history.length > 0 && <span className="bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{history.length}</span>}
        </button>
      </div>

      {showHistory && (
        <div className="mb-6 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700">{t("studio.history")}</h3>
            {history.length > 0 && <button onClick={ch} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><Trash2 size={12} /> {t("studio.history.clear")}</button>}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">{t("studio.history.empty")}</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((item) => (
                <button key={item.id} onClick={() => uhf(item)} className="shrink-0 w-20 group">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group-hover:border-violet-400 transition-all">
                    {item.resultBase64 && <Image src={`data:image/jpeg;base64,${item.resultBase64}`} alt="" fill className="object-cover" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 truncate">{new Date(item.timestamp).toLocaleTimeString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">{t("studio.person.label")}</label>
            {personImage ? (
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                <Image src={personImage} alt="" fill className="object-contain" />
                <button onClick={() => setPersonImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition z-10"><Trash2 size={14} /></button>
                <button onClick={() => oc("person")} className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition z-10"><Camera size={14} /></button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => pi.current?.click()} className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition-all">
                  <Upload size={24} className="text-zinc-300" /><span className="text-xs text-zinc-400">{t("studio.person.upload")}</span>
                </button>
                <button onClick={() => oc("person")} className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition-all">
                  <Camera size={24} className="text-zinc-300" /><span className="text-xs text-zinc-400">{t("studio.person.camera")}</span>
                </button>
              </div>
            )}
            <input ref={pi} type="file" accept="image/*" onChange={hp} className="hidden" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">{t("studio.cloth.label")}</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => ci.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 flex flex-col items-center justify-center gap-1 hover:border-violet-500 hover:bg-violet-100 transition-all">
                <Plus size={20} className="text-violet-400" /><span className="text-[10px] text-violet-500 font-medium">{t("studio.cloth.add")}</span>
              </button>
              <button onClick={() => oc("cloth")} className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-1 hover:border-violet-400 hover:bg-violet-50 transition-all">
                <Camera size={20} className="text-zinc-300" /><span className="text-[10px] text-zinc-400">{t("studio.cloth.camera")}</span>
              </button>
            </div>
            <input ref={ci} type="file" accept="image/*" multiple onChange={hc} className="hidden" />
            {clothItems.length > 0 && (
              <div>
                <p className="text-xs text-zinc-400 mb-2">{t("studio.cloth.selected")} <span className="font-semibold text-violet-600">{clothItems.length}</span> {t("studio.cloth.hint")}</p>
                <div className="grid grid-cols-4 gap-2">
                  {clothItems.map((item) => (
                    <div key={item.id} className="relative">
                      <button onClick={() => setSelectedClothId(item.id)}
                        className={cn("relative aspect-square rounded-xl overflow-hidden border-2 bg-zinc-50 transition-all w-full", selectedClothId === item.id ? "border-violet-500 ring-2 ring-violet-200" : "border-zinc-200 hover:border-violet-300")}>
                        <Image src={item.dataUrl} alt="" fill className="object-contain" />
                      </button>
                      <button onClick={() => rm(item.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 z-10"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={hto} disabled={loading || !personImage || !clothImage} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
            {loading ? <><Loader2 size={18} className="animate-spin" /> {t("studio.button.loading")}</> : <><Wand2 size={18} /> {t("studio.button.tryon")}</>}
          </button>
          {error && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><Sparkles size={16} className="text-violet-500" /> {t("studio.result.title")}</h3>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 min-h-[350px]">
              <div className="relative"><div className="h-16 w-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" /><Sparkles size={20} className="absolute inset-0 m-auto text-violet-500" /></div>
              <div className="text-center"><p className="font-semibold text-violet-700">{t("studio.result.loading")}</p><p className="text-sm text-violet-400 mt-1">{t("studio.result.wait")}</p></div>
            </div>
          )}

          {!loading && !showResult && !error && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 min-h-[350px]">
              <div className="rounded-full bg-zinc-100 p-6"><Shirt size={40} className="text-zinc-300" /></div>
              <div className="text-center"><p className="font-semibold text-zinc-500">{t("studio.result.empty")}</p><p className="text-sm text-zinc-400 mt-1">{t("studio.result.hint")}</p></div>
            </div>
          )}

          {showResult && resultImage && !loading && (
            <div className="space-y-4">
              {personImage && (
                <div ref={cr} className="relative rounded-xl overflow-hidden border border-zinc-200 select-none cursor-ew-resize" onMouseDown={hsm}>
                  <div className="relative aspect-[3/4] w-full bg-zinc-50">
                    <Image src={resultImage} alt="" fill className="object-contain" />
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                      <Image src={personImage} alt="" fill className="object-contain" />
                    </div>
                    <div className="absolute bottom-2 left-2 z-20 flex gap-2">
                      <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">{t("studio.result.before")}</span>
                      <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded">{t("studio.result.after")}</span>
                    </div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${sliderPos}%` }}>
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-lg border border-zinc-200">
                        <ChevronLeft size={14} className="text-zinc-600" /><ChevronRight size={14} className="text-zinc-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {modelUsed && <span className="tag tag-violet">{modelUsed}</span>}
                  <span className="text-[10px] tag tag-green">{t("studio.result.free")}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowZoom(true)} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition" title={t("studio.zoom")}><ZoomIn size={16} /></button>
                  <button onClick={hd} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition" title={t("studio.download")}><Download size={16} /></button>
                  <button onClick={hr} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition" title={t("studio.reset")}><RotateCcw size={16} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showZoom && resultImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <Image src={resultImage} alt="" width={1024} height={1024} className="w-full h-auto rounded-2xl" />
            <button onClick={() => setShowZoom(false)} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}