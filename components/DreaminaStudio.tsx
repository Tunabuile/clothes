"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Sparkles,
  Shirt,
  Wand2,
  Glasses,
  Upload,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

type TabMode = "outfit" | "inpaint" | "accessory";

type AccessoryType =
  | "glasses"
  | "hat"
  | "bag"
  | "necklace"
  | "earrings"
  | "watch"
  | "belt";

const ACCESSORY_TYPES: { value: AccessoryType; label: string; icon: string }[] = [
  { value: "glasses", label: "Kính mắt", icon: "👓" },
  { value: "hat", label: "Mũ", icon: "🧢" },
  { value: "bag", label: "Túi xách", icon: "👜" },
  { value: "necklace", label: "Dây chuyền", icon: "📿" },
  { value: "earrings", label: "Bông tai", icon: "💎" },
  { value: "watch", label: "Đồng hồ", icon: "⌚" },
  { value: "belt", label: "Thắt lưng", icon: "🔗" },
];

export default function DreaminaStudio() {
  const [mode, setMode] = useState<TabMode>("outfit");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothImage, setClothImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [accessoryType, setAccessoryType] = useState<AccessoryType>("glasses");
  const [accessoryDesc, setAccessoryDesc] = useState("a pair of stylish sunglasses");
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const personInputRef = useRef<HTMLInputElement>(null);
  const clothInputRef = useRef<HTMLInputElement>(null);
  const inpaintInputRef = useRef<HTMLInputElement>(null);

  const handlePersonUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPersonImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleClothUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setClothImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleInpaintUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPersonImage(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleTryOn = async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    setResultImage(null);
    setModelUsed(null);

    try {
      const body: Record<string, any> = { mode };

      if (mode === "outfit") {
        if (!personImage || !clothImage) {
          setError("Vui lòng upload cả ảnh người và ảnh quần áo");
          setLoading(false);
          return;
        }
        body.personImageBase64 = personImage;
        body.clothImageBase64 = clothImage;
      } else if (mode === "inpaint") {
        if (!personImage || !inpaintPrompt) {
          setError("Vui lòng upload ảnh và nhập mô tả");
          setLoading(false);
          return;
        }
        body.imageBase64 = personImage;
        body.prompt = inpaintPrompt;
      } else if (mode === "accessory") {
        if (!personImage) {
          setError("Vui lòng upload ảnh người");
          setLoading(false);
          return;
        }
        body.personImageBase64 = personImage;
        body.accessoryType = accessoryType;
        body.accessoryDescription = accessoryDesc;
      }

      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi không xác định");
      }

      setResultImage(data.resultBase64 ? `data:image/jpeg;base64,${data.resultBase64}` : data.resultImageUrl);
      setModelUsed(data.modelUsed);
      setShowResult(true);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPersonImage(null);
    setClothImage(null);
    setResultImage(null);
    setShowResult(false);
    setError(null);
    setModelUsed(null);
    setSliderPos(50);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-zinc-100 p-1.5 rounded-2xl">
        {[
          { value: "outfit" as TabMode, label: "Thử đồ", icon: Shirt },
          { value: "inpaint" as TabMode, label: "Sửa ảnh AI", icon: Wand2 },
          { value: "accessory" as TabMode, label: "Phụ kiện", icon: Glasses },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setMode(tab.value); setShowResult(false); setError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
              mode === tab.value
                ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Input */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
              <Upload size={16} className="text-violet-500" />
              {mode === "outfit"
                ? "Ảnh đầu vào"
                : mode === "inpaint"
                ? "Ảnh cần chỉnh sửa"
                : "Ảnh người mẫu"}
            </h3>

            {/* Person Image */}
            {mode !== "inpaint" && (
              <div className="mb-3">
                <label className="text-xs text-zinc-400 mb-1.5 block">
                  {mode === "outfit" ? "Ảnh người (full body)" : "Ảnh người"}
                </label>
                {personImage ? (
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                    <Image src={personImage} alt="Person" fill className="object-contain" />
                    <button
                      onClick={() => setPersonImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => personInputRef.current?.click()}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition cursor-pointer"
                  >
                    <Upload size={24} className="text-zinc-300" />
                    <span className="text-xs text-zinc-400">Nhấn để upload</span>
                  </button>
                )}
                <input ref={personInputRef} type="file" accept="image/*" onChange={handlePersonUpload} className="hidden" />
              </div>
            )}

            {/* Inpaint image upload */}
            {mode === "inpaint" && (
              <div className="mb-3">
                {personImage ? (
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                    <Image src={personImage} alt="Input" fill className="object-contain" />
                    <button
                      onClick={() => setPersonImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => inpaintInputRef.current?.click()}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition cursor-pointer"
                  >
                    <Upload size={24} className="text-zinc-300" />
                    <span className="text-xs text-zinc-400">Nhấn để upload ảnh</span>
                  </button>
                )}
                <input ref={inpaintInputRef} type="file" accept="image/*" onChange={handleInpaintUpload} className="hidden" />
              </div>
            )}

            {/* Cloth Image (outfit mode only) */}
            {mode === "outfit" && (
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Ảnh quần áo</label>
                {clothImage ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                    <Image src={clothImage} alt="Cloth" fill className="object-contain" />
                    <button
                      onClick={() => setClothImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => clothInputRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition cursor-pointer"
                  >
                    <Upload size={24} className="text-zinc-300" />
                    <span className="text-xs text-zinc-400">Nhấn để upload</span>
                  </button>
                )}
                <input ref={clothInputRef} type="file" accept="image/*" onChange={handleClothUpload} className="hidden" />
              </div>
            )}

            {/* Inpaint Prompt */}
            {mode === "inpaint" && (
              <div className="mt-3">
                <label className="text-xs text-zinc-400 mb-1.5 block">Mô tả thay đổi</label>
                <textarea
                  value={inpaintPrompt}
                  onChange={(e) => setInpaintPrompt(e.target.value)}
                  placeholder='VD: "Thay áo thành sơ mi trắng", "Thêm khăn quàng cổ đỏ"...'
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            )}

            {/* Accessory Options */}
            {mode === "accessory" && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Loại phụ kiện</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ACCESSORY_TYPES.map((acc) => (
                      <button
                        key={acc.value}
                        onClick={() => setAccessoryType(acc.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition ${
                          accessoryType === acc.value
                            ? "bg-violet-100 text-violet-700 border-2 border-violet-400"
                            : "bg-zinc-50 text-zinc-500 border-2 border-transparent hover:border-zinc-200"
                        }`}
                      >
                        <span className="text-lg">{acc.icon}</span>
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1.5 block">Mô tả phụ kiện</label>
                  <input
                    value={accessoryDesc}
                    onChange={(e) => setAccessoryDesc(e.target.value)}
                    placeholder='VD: "kính râm đen", "mũ lưỡi trai đỏ"...'
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleTryOn}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-violet-200"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {mode === "outfit" ? "Thử đồ ngay" : mode === "inpaint" ? "Sửa ảnh" : "Thử phụ kiện"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Result */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            Kết quả
          </h3>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 min-h-[300px]">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-violet-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-violet-700">AI đang xử lý...</p>
                <p className="text-sm text-violet-400 mt-1">Khoảng 20–40 giây</p>
              </div>
            </div>
          )}

          {!loading && !showResult && !error && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 min-h-[300px]">
              <div className="rounded-full bg-zinc-100 p-5">
                <Sparkles size={32} className="text-zinc-300" />
              </div>
              <p className="text-sm text-zinc-400">Kết quả sẽ hiển thị ở đây</p>
            </div>
          )}

          {showResult && resultImage && !loading && (
            <div className="space-y-3">
              {/* Before/After slider */}
              {personImage && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 select-none">
                  <div className="relative aspect-[3/4] w-full">
                    <Image src={resultImage} alt="After" fill className="object-contain" />
                    {/* Slider overlay showing before image */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <Image src={personImage} alt="Before" fill className="object-contain" />
                    </div>
                    {/* Slider handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-lg">
                        <div className="flex gap-0.5 text-zinc-600">
                          <ChevronLeft size={12} />
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!personImage && (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <Image src={resultImage} alt="Result" fill className="object-contain" />
                </div>
              )}

              {/* Model info */}
              {modelUsed && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="bg-zinc-100 px-2 py-1 rounded-lg">{modelUsed}</span>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-600 font-medium hover:bg-zinc-50 transition"
              >
                <RotateCcw size={16} />
                Làm lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}