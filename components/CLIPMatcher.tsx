"use client";

import { useState } from "react";
import { Zap, Brain, Star, ChevronDown, ChevronUp, Wand2, MessageSquare, Loader2, ImagePlus } from "lucide-react";
import Image from "next/image";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import OutfitFeedback from "./OutfitFeedback";

interface CLIPCombo {
  id: string;
  name: string;
  occasion: string;
  vibe: string;
  items: string[];
  reasoning: string;
  tips: string;
  score: number;
  clipScore: number;
  savedId?: string;
  rated?: boolean;
  generatedImage?: string;
}

interface CompatScore {
  item1Id: string;
  item2Id: string;
  score: number;
  label: string;
}

interface CLIPMatcherProps {
  closet: ClothingItem[];
  onTryOutfit: (items: ClothingItem[]) => void;
}

const OCCASIONS = ["Hàng ngày", "Đi làm", "Đi chơi", "Hẹn hò", "Thể thao", "Tiệc tùng"];
const WEATHERS = ["Bình thường", "Nắng nóng", "Mát mẻ", "Lạnh", "Mưa"];

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-500" :
    score >= 55 ? "bg-blue-500" :
    score >= 35 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-zinc-600 w-8 text-right">{score}</span>
    </div>
  );
}

export default function CLIPMatcher({ closet, onTryOutfit }: CLIPMatcherProps) {
  const [occasion, setOccasion] = useState("Hàng ngày");
  const [weather, setWeather] = useState("Bình thường");
  const [combos, setCombos] = useState<CLIPCombo[]>([]);
  const [compatScores, setCompatScores] = useState<CompatScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackComboId, setFeedbackComboId] = useState<string | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [usedCLIP, setUsedCLIP] = useState(false);

  const clothesWithImages = closet.filter((c) => c.imageBase64);

  const handleMatch = async () => {
    if (closet.length < 2) { setError("Cần ít nhất 2 món đồ!"); return; }
    setIsLoading(true);
    setError("");
    setCombos([]);
    setCompatScores([]);

    try {
      const res = await fetch("/api/match-clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clothes: closet.map((c) => ({
            id: c.id, type: c.type, color: c.color,
            material: c.material, style: c.style,
            imageBase64: c.imageBase64,
          })),
          occasion, weather,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCombos(data.combos || []);
      setCompatScores(data.compatibilityScores || []);
      setUsedCLIP(data.usedCLIP || false);
      if (data.combos?.length > 0) setExpandedId(data.combos[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi phân tích");
    } finally {
      setIsLoading(false);
    }
  };

  const getItems = (ids: string[]) =>
    ids.map((id) => closet.find((c) => c.id === id)).filter(Boolean) as ClothingItem[];

  const handleFeedback = async (combo: CLIPCombo, rating: number, feedback: string, worn: boolean) => {
    if (!combo.savedId) return;
    await fetch("/api/outfit-feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId: combo.savedId, rating, feedback, worn }),
    });
    setCombos((prev) => prev.map((c) => c.id === combo.id ? { ...c, rated: true } : c));
    setFeedbackComboId(null);
  };

  const handleGenerateImage = async (combo: CLIPCombo) => {
    const items = getItems(combo.items);
    setGeneratingImageId(combo.id);
    try {
      const prompt = `${combo.name}: ${items.map((i) => `${i.color} ${i.type}`).join(", ")}. ${combo.vibe} fashion flat lay, white background.`;
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: "realistic", aspectRatio: "1:1" }),
      });
      const data = await res.json();
      if (data.imageBase64) {
        setCombos((prev) => prev.map((c) =>
          c.id === combo.id
            ? { ...c, generatedImage: `data:${data.mimeType};base64,${data.imageBase64}` }
            : c
        ));
      }
    } catch { /* silent */ }
    finally { setGeneratingImageId(null); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-xl bg-blue-600 p-2">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">CLIP Visual Matcher</h3>
            <p className="text-xs text-zinc-400">
              AI nhìn ảnh thật → tính độ tương thích → chọn combo đẹp nhất
            </p>
          </div>
          {usedCLIP && (
            <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              ⚡ CLIP Active
            </span>
          )}
        </div>

        {/* Cảnh báo nếu không có ảnh */}
        {clothesWithImages.length < closet.length && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            ⚠️ {closet.length - clothesWithImages.length} món chưa có ảnh — CLIP sẽ bỏ qua các món đó
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-600">🎯 Dịp mặc</label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button key={o} onClick={() => setOccasion(o)}
                  className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                    occasion === o ? "bg-blue-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-blue-400"
                  )}>{o}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-600">🌤️ Thời tiết</label>
            <div className="flex flex-wrap gap-1.5">
              {WEATHERS.map((w) => (
                <button key={w} onClick={() => setWeather(w)}
                  className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                    weather === w ? "bg-blue-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-blue-400"
                  )}>{w}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleMatch} disabled={isLoading || closet.length < 2}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Zap size={16} />
          {isLoading ? "CLIP đang phân tích ảnh..." : `⚡ Ghép đồ bằng CLIP (${clothesWithImages.length} ảnh)`}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-white py-12">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <Zap size={20} className="absolute inset-0 m-auto text-blue-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-blue-700">CLIP đang nhìn vào từng món đồ...</p>
            <p className="text-sm text-zinc-400 mt-1">Tính toán độ tương thích màu sắc & style 🔬</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">⚠️ {error}</div>
      )}

      {/* Compatibility Matrix */}
      {compatScores.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-zinc-50 transition"
          >
            <p className="text-sm font-semibold text-zinc-700">
              🔬 Ma trận tương thích CLIP ({compatScores.length} cặp)
            </p>
            {showMatrix ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
          </button>

          {showMatrix && (
            <div className="border-t border-zinc-100 p-4 flex flex-col gap-2 max-h-64 overflow-y-auto">
              {compatScores.map((s, i) => {
                const item1 = closet.find((c) => c.id === s.item1Id);
                const item2 = closet.find((c) => c.id === s.item2Id);
                if (!item1 || !item2) return null;
                return (
                  <div key={i} className="flex items-center gap-3">
                    {/* Item 1 */}
                    <div className="flex items-center gap-1.5 w-28 shrink-0">
                      <div className="relative h-8 w-8 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden shrink-0">
                        <Image src={item1.imageUrl} alt={item1.type} fill className="object-cover" />
                      </div>
                      <span className="text-xs text-zinc-500 truncate">{item1.type}</span>
                    </div>
                    {/* Score bar */}
                    <div className="flex-1">
                      <ScoreBar score={s.score} />
                    </div>
                    {/* Item 2 */}
                    <div className="flex items-center gap-1.5 w-28 shrink-0 justify-end">
                      <span className="text-xs text-zinc-500 truncate">{item2.type}</span>
                      <div className="relative h-8 w-8 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden shrink-0">
                        <Image src={item2.imageUrl} alt={item2.type} fill className="object-cover" />
                      </div>
                    </div>
                    {/* Label */}
                    <span className={cn("shrink-0 text-xs font-medium w-16 text-right",
                      s.score >= 75 ? "text-green-600" :
                      s.score >= 55 ? "text-blue-600" :
                      s.score >= 35 ? "text-yellow-600" : "text-red-500"
                    )}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Combo results */}
      {combos.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-zinc-600">
            ⚡ {combos.length} combo CLIP chọn cho dịp &quot;{occasion}&quot;
          </p>

          {combos.map((combo, idx) => {
            const items = getItems(combo.items);
            const isExpanded = expandedId === combo.id;

            return (
              <div key={combo.id}
                className={cn("rounded-2xl border bg-white overflow-hidden transition-all",
                  isExpanded ? "border-blue-300 shadow-md" : "border-zinc-200"
                )}
              >
                {/* Header */}
                <button onClick={() => setExpandedId(isExpanded ? null : combo.id)}
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-zinc-50 transition"
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-zinc-100 text-zinc-600" : "bg-orange-100 text-orange-700"
                  )}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </div>

                  <div className="flex -space-x-2">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="relative h-10 w-10 rounded-full border-2 border-white bg-zinc-100 overflow-hidden">
                        <Image src={item.imageUrl} alt={item.type} fill className="object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{combo.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{combo.occasion} • {items.length} món</p>
                  </div>

                  {/* CLIP score */}
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <div className="flex items-center gap-1">
                      <Zap size={11} className="text-blue-500" />
                      <span className="text-xs font-bold text-blue-600">{combo.clipScore}/100</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-zinc-600">{combo.score}/10</span>
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp size={16} className="text-zinc-400 shrink-0" /> : <ChevronDown size={16} className="text-zinc-400 shrink-0" />}
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 p-4 flex flex-col gap-4">
                    {/* Ảnh món đồ + CLIP score từng cặp */}
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {items.map((item) => (
                        <div key={item.id} className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className="relative h-24 w-20 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">
                            <Image src={item.imageUrl} alt={item.type} fill className="object-contain p-1" />
                          </div>
                          <p className="text-xs text-zinc-500 text-center max-w-[80px] truncate">{item.type}</p>
                          <p className="text-xs text-zinc-400">{item.color}</p>
                        </div>
                      ))}
                    </div>

                    {/* CLIP reasoning */}
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">⚡ CLIP phân tích</p>
                      <p className="text-sm text-zinc-700 leading-relaxed">{combo.reasoning}</p>
                    </div>

                    {/* Tips */}
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">💡 Mẹo mặc thêm</p>
                      <p className="text-sm text-zinc-700 leading-relaxed">{combo.tips}</p>
                    </div>

                    {/* Generated image */}
                    {combo.generatedImage ? (
                      <div className="relative h-56 w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                        <Image src={combo.generatedImage} alt={combo.name} fill className="object-contain p-2" />
                        <span className="absolute top-2 left-2 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">✨ AI minh họa</span>
                      </div>
                    ) : (
                      <button onClick={() => handleGenerateImage(combo)} disabled={generatingImageId === combo.id}
                        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition"
                      >
                        {generatingImageId === combo.id
                          ? <><Loader2 size={14} className="animate-spin" /> Đang tạo ảnh...</>
                          : <><ImagePlus size={14} /> Tạo ảnh minh họa</>}
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => onTryOutfit(items)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                      >
                        <Wand2 size={14} /> Thử outfit này
                      </button>
                      {combo.rated ? (
                        <div className="flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3 text-xs font-medium text-green-600">✅ Đã rate</div>
                      ) : (
                        <button onClick={() => setFeedbackComboId(combo.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-500 hover:border-blue-400 hover:text-blue-600 transition"
                        >
                          <MessageSquare size={14} /> Rate
                        </button>
                      )}
                    </div>

                    {feedbackComboId === combo.id && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
                        <OutfitFeedback
                          outfitId={combo.savedId || combo.id}
                          outfitName={combo.name}
                          onSubmit={(r, f, w) => handleFeedback(combo, r, f, w)}
                          onClose={() => setFeedbackComboId(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && combos.length === 0 && !error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-12">
          <div className="rounded-full bg-blue-50 p-5">
            <Brain size={28} className="text-blue-300" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-zinc-500">CLIP chưa phân tích</p>
            <p className="text-sm text-zinc-400 mt-1">Nhấn &quot;Ghép đồ bằng CLIP&quot; để AI nhìn ảnh và chọn combo đẹp nhất</p>
          </div>
        </div>
      )}
    </div>
  );
}
