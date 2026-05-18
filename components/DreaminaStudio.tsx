"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Shirt,
  Wand2,
  Upload,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  AlertCircle,
  History,
  Trash2,
  Download,
  ZoomIn,
  Camera,
  X,
  Plus,
} from "lucide-react";

interface HistoryItem {
  id: string;
  personImage: string;
  clothImage: string;
  resultBase64: string;
  modelUsed: string;
  timestamp: number;
}

interface ClothItem {
  id: string;
  dataUrl: string;
}

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("tryon-history");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem("tryon-history", JSON.stringify(items.slice(0, 20)));
  } catch {}
}

let clothIdCounter = 0;
function nextClothId() {
  return `cloth_${++clothIdCounter}_${Date.now()}`;
}

export default function DreaminaStudio() {
  const [personImage, setPersonImage] = useState<string | null>(null);

  // Multi cloth images
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

  // Camera
  const [cameraTarget, setCameraTarget] = useState<"person" | "cloth" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const personInputRef = useRef<HTMLInputElement>(null);
  const clothInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const camCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handlePersonUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPersonImage(reader.result as string);
        setShowResult(false);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleClothUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const id = nextClothId();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setClothItems((prev) => [...prev, { id, dataUrl }]);
        setSelectedClothId((prev) => prev || id);
        setShowResult(false);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // ─── CAMERA ───────────────────────────────────────────────

  const openCamera = useCallback(async (target: "person" | "cloth") => {
    setCameraTarget(target);
    setCameraReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onplaying = () => setCameraReady(true);
          videoRef.current.play();
        }
      }, 50);
    } catch (err: any) {
      setError(
        err.message?.includes("Permission")
          ? "Bạn chưa cấp quyền camera. Vui lòng cho phép camera."
          : "Không thể truy cập camera."
      );
      setCameraTarget(null);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = camCanvasRef.current;
    if (!video || !canvas || !cameraStream) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    if (cameraTarget === "person") {
      setPersonImage(dataUrl);
    } else {
      const id = nextClothId();
      setClothItems((prev) => [...prev, { id, dataUrl }]);
      setSelectedClothId(id);
    }

    setShowResult(false);
    setResultImage(null);
    closeCamera();
  }, [cameraTarget, cameraStream]);

  const closeCamera = useCallback(() => {
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraTarget(null);
    setCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [cameraStream]);

  const removeClothItem = useCallback((id: string) => {
    setClothItems((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (selectedClothId === id) {
        setSelectedClothId(next[0]?.id || null);
      }
      return next;
    });
    setShowResult(false);
    setResultImage(null);
  }, [selectedClothId]);

  // ─── TRY-ON ───────────────────────────────────────────────

  const handleTryOn = async () => {
    if (!personImage || !clothImage) {
      setError("Vui lòng upload cả ảnh người và ảnh quần áo");
      return;
    }
    setLoading(true);
    setError(null);
    setShowResult(false);
    setResultImage(null);
    setModelUsed(null);

    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "outfit", personImageBase64: personImage, clothImageBase64: clothImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi không xác định");

      const resultUrl = data.resultBase64 ? `data:image/jpeg;base64,${data.resultBase64}` : data.resultImageUrl;
      setResultImage(resultUrl);
      setModelUsed(data.modelUsed);
      setShowResult(true);
      setSliderPos(50);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        personImage: personImage,
        clothImage: clothImage,
        resultBase64: data.resultBase64 || "",
        modelUsed: data.modelUsed || "unknown",
        timestamp: Date.now(),
      };
      const updatedHistory = [newItem, ...loadHistory()];
      saveHistory(updatedHistory);
      setHistory(updatedHistory);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setClothItems([]);
    setSelectedClothId(null);
    setResultImage(null);
    setShowResult(false);
    setError(null);
    setModelUsed(null);
    setSliderPos(50);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `fitai-tryon-${Date.now()}.jpg`;
    a.click();
  };

  const handleClearHistory = () => {
    saveHistory([]);
    setHistory([]);
  };

  const handleUseFromHistory = (item: HistoryItem) => {
    setPersonImage(item.personImage);
    setClothItems([{ id: nextClothId(), dataUrl: item.clothImage }]);
    setSelectedClothId(null);
    setResultImage(item.resultBase64 ? `data:image/jpeg;base64,${item.resultBase64}` : null);
    setShowResult(!!item.resultBase64);
    setShowHistory(false);
  };

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = canvasRef.current;
    if (!container) return;
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setSliderPos(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Camera Modal */}
      {cameraTarget && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md">
            <video ref={videoRef} className="w-full rounded-2xl bg-black" playsInline muted />
            <canvas ref={camCanvasRef} className="hidden" />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-6">
            <button onClick={closeCamera} className="px-6 py-3 rounded-xl bg-zinc-700 text-white font-medium hover:bg-zinc-600 transition">
              <X size={18} className="inline mr-1" /> Hủy
            </button>
            <button onClick={capturePhoto} disabled={!cameraReady} className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-40 transition">
              📷 Chụp
            </button>
          </div>
          <p className="text-zinc-400 text-sm mt-3">
            {cameraReady ? "Nhấn Chụp để lấy ảnh" : "Đang khởi động camera..."}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Shirt size={22} className="text-violet-600" />
          Thử đồ AI
          <span className="text-xs font-normal text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">100% FREE</span>
        </h2>
        <button onClick={() => setShowHistory(!showHistory)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition ${showHistory ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
          <History size={16} />
          Lịch sử
          {history.length > 0 && (
            <span className="bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{history.length}</span>
          )}
        </button>
      </div>

      {/* History */}
      {showHistory && (
        <div className="mb-6 bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700">Lịch sử thử đồ</h3>
            {history.length > 0 && (
              <button onClick={handleClearHistory} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <Trash2 size={12} /> Xóa tất cả
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">Chưa có lịch sử. Thử đồ ngay để lưu lại!</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((item) => (
                <button key={item.id} onClick={() => handleUseFromHistory(item)} className="shrink-0 w-20 space-y-1.5 group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 group-hover:border-violet-400 transition">
                    {item.resultBase64 && (
                      <Image src={`data:image/jpeg;base64,${item.resultBase64}`} alt="History" fill className="object-cover" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">{new Date(item.timestamp).toLocaleTimeString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── LEFT ─── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6">
            {/* Person */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">📸 Ảnh người (full body)</label>
              {personImage ? (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <Image src={personImage} alt="Person" fill className="object-contain" />
                  <button onClick={() => setPersonImage(null)} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition z-10" title="Xóa"><Trash2 size={14} /></button>
                  <button onClick={() => openCamera("person")} className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition z-10" title="Chụp"><Camera size={14} /></button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => personInputRef.current?.click()} className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition cursor-pointer">
                    <Upload size={24} className="text-zinc-300" /><span className="text-xs text-zinc-400">Upload ảnh</span>
                  </button>
                  <button onClick={() => openCamera("person")} className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition cursor-pointer">
                    <Camera size={24} className="text-zinc-300" /><span className="text-xs text-zinc-400">Chụp ảnh</span>
                  </button>
                </div>
              )}
              <input ref={personInputRef} type="file" accept="image/*" onChange={handlePersonUpload} className="hidden" />
            </div>

            {/* Cloth - MULTI */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">👕 Ảnh quần áo (chọn nhiều)</label>

              {/* Upload button + Camera */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => clothInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 flex flex-col items-center justify-center gap-1 hover:border-violet-500 hover:bg-violet-100 transition cursor-pointer">
                  <Plus size={20} className="text-violet-400" />
                  <span className="text-[10px] text-violet-500 font-medium">Thêm ảnh</span>
                </button>
                <button onClick={() => openCamera("cloth")} className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-1 hover:border-violet-400 hover:bg-violet-50 transition cursor-pointer">
                  <Camera size={20} className="text-zinc-300" />
                  <span className="text-[10px] text-zinc-400">Chụp ảnh</span>
                </button>
              </div>
              <input ref={clothInputRef} type="file" accept="image/*" multiple onChange={handleClothUpload} className="hidden" />

              {/* Cloth thumbnails */}
              {clothItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-400">
                    Đã chọn <span className="font-semibold text-violet-600">{clothItems.length}</span> ảnh — chọn ảnh có <span className="font-semibold text-violet-600">viền tím</span> để thử
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {clothItems.map((item) => (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => setSelectedClothId(item.id)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-zinc-50 transition w-full ${selectedClothId === item.id ? "border-violet-500 ring-2 ring-violet-200" : "border-zinc-200 hover:border-violet-300"}`}
                        >
                          <Image src={item.dataUrl} alt="Cloth" fill className="object-contain" />
                        </button>
                        <button onClick={() => removeClothItem(item.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 z-10" title="Xóa">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleTryOn} disabled={loading || !personImage || !clothImage} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-violet-200">
              {loading ? <><Loader2 size={18} className="animate-spin" /> AI đang thử đồ...</> : <><Wand2 size={18} /> Thử đồ ngay ✨</>}
            </button>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mt-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT ─── */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4 flex items-center gap-2"><Sparkles size={16} className="text-violet-500" /> Kết quả</h3>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 min-h-[350px]">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-violet-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-violet-700">AI đang thử đồ cho bạn...</p>
                <p className="text-sm text-violet-400 mt-1">⏱️ Khoảng 15–30 giây</p>
              </div>
            </div>
          )}

          {!loading && !showResult && !error && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 min-h-[350px]">
              <div className="rounded-full bg-zinc-100 p-6"><Shirt size={40} className="text-zinc-300" /></div>
              <div className="text-center">
                <p className="font-semibold text-zinc-500">Chưa có kết quả</p>
                <p className="text-sm text-zinc-400 mt-1">Upload ảnh người + quần áo bên trái</p>
              </div>
            </div>
          )}

          {showResult && resultImage && !loading && (
            <div className="space-y-4">
              {personImage && (
                <div ref={canvasRef} className="relative rounded-xl overflow-hidden border border-zinc-200 select-none cursor-ew-resize" onMouseDown={handleSliderMouseDown}>
                  <div className="relative aspect-[3/4] w-full bg-zinc-50">
                    <Image src={resultImage} alt="After" fill className="object-contain" />
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                      <Image src={personImage} alt="Before" fill className="object-contain" />
                    </div>
                    <div className="absolute bottom-2 left-2 z-20 flex gap-2">
                      <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Trước</span>
                      <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Sau</span>
                    </div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${sliderPos}%` }}>
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-1.5 shadow-lg border border-zinc-200">
                        <ChevronLeft size={14} className="text-zinc-600" /><ChevronRight size={14} className="text-zinc-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {modelUsed && <span className="bg-violet-50 text-violet-600 text-[10px] font-medium px-2 py-0.5 rounded-lg border border-violet-200">{modelUsed}</span>}
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">✅ Miễn phí</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowZoom(true)} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition" title="Phóng to"><ZoomIn size={16} /></button>
                  <button onClick={handleDownload} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition" title="Tải về"><Download size={16} /></button>
                  <button onClick={handleReset} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition" title="Làm lại"><RotateCcw size={16} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && resultImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <div className="relative max-w-2xl w-full max-h-[90vh]">
            <Image src={resultImage} alt="Zoom" width={1024} height={1024} className="w-full h-auto rounded-2xl object-contain" />
            <button onClick={() => setShowZoom(false)} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}