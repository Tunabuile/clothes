"use client";

import { useState } from "react";
import { Sparkles, Brain, Star, ChevronDown, ChevronUp, Wand2, MessageSquare, ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import OutfitFeedback from "./OutfitFeedback";

interface OutfitCombo {
  id: string;
  name: string;
  occasion: string;
  vibe: string;
  items: string[];
  reasoning: string;
  tips: string;
  score: number;
  savedId?: string; // ID sau khi lưu vào DB
  rated?: boolean;
  generatedImage?: string; // base64 ảnh minh họa (tạo khi cần)
}

interface OutfitSuggestionProps {
  closet: ClothingItem[];
  onTryOutfit: (items: ClothingItem[]) => void;
}

const OCCASIONS = [
  "Hàng ngày",
  "Đi làm",
  "Đi chơi",
  "Hẹn hò",
  "Thể thao",
  "Tiệc tùng",
  "Đi biển",
];

const WEATHERS = ["Bình thường", "Nắng nóng", "Mát mẻ", "Lạnh", "Mưa"];

const VIBE_COLORS: Record<string, string> = {
  "Năng động": "bg-orange-100 text-orange-700",
  "Thanh lịch": "bg-blue-100 text-blue-700",
  "Thoải mái": "bg-green-100 text-green-700",
  "Cá tính": "bg-purple-100 text-purple-700",
  "Ngọt ngào": "bg-pink-100 text-pink-700",
  "Tối giản": "bg-zinc-100 text-zinc-700",
};

export default function OutfitSuggestion({
  closet,
  onTryOutfit,
}: OutfitSuggestionProps) {
  const [occasion, setOccasion] = useState("Hàng ngày");
  const [weather, setWeather] = useState("Bình thường");
  const [combos, setCombos] = useState<OutfitCombo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackComboId, setFeedbackComboId] = useState<string | null>(null);
  const [hasPersonalization, setHasPersonalization] = useState(false);
  const [profileSummary, setProfileSummary] = useState("");
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

  const handleSuggest = async () => {
    if (closet.length < 2) {
      setError("Cần ít nhất 2 món đồ trong tủ!");
      return;
    }
    setIsLoading(true);
    setError("");
    setCombos([]);

    try {
      const res = await fetch("/api/suggest-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clothes: closet.map((c) => ({
            id: c.id,
            type: c.type,
            color: c.color,
            material: c.material,
            style: c.style,
            imageBase64: c.imageBase64,
          })),
          occasion,
          weather,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newCombos: OutfitCombo[] = data.combos || [];
      setCombos(newCombos);
      setHasPersonalization(data.hasPersonalization || false);
      setProfileSummary(data.profileSummary || "");
      if (newCombos.length > 0) setExpandedId(newCombos[0].id);

      // Lưu từng combo vào DB để track feedback
      for (const combo of newCombos) {
        const savedId = crypto.randomUUID();
        try {
          await fetch("/api/outfit-feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: savedId,
              item_ids: combo.items,
              occasion,
              weather,
              ai_reasoning: combo.reasoning,
              ai_tips: combo.tips,
              ai_score: combo.score,
            }),
          });
          combo.savedId = savedId;
        } catch { /* lưu DB thất bại không block UI */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi phân tích outfit");
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy ClothingItem từ IDs trong combo
  const getComboItems = (itemIds: string[]): ClothingItem[] =>
    itemIds
      .map((id) => closet.find((c) => c.id === id))
      .filter(Boolean) as ClothingItem[];

  const handleFeedback = async (
    combo: OutfitCombo,
    rating: number,
    feedback: string,
    worn: boolean
  ) => {
    if (!combo.savedId) return;
    await fetch("/api/outfit-feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outfitId: combo.savedId,
        rating,
        feedback,
        worn,
      }),
    });
    setCombos((prev) =>
      prev.map((c) => (c.id === combo.id ? { ...c, rated: true } : c))
    );
    setFeedbackComboId(null);
  };

  // Tạo ảnh minh họa outfit khi user yêu cầu
  const handleGenerateImage = async (combo: OutfitCombo) => {
    const comboItems = getComboItems(combo.items);
    setGeneratingImageId(combo.id);
    try {
      const prompt = `${combo.name} outfit: ${comboItems.map(i => `${i.color} ${i.type}`).join(", ")}. ${combo.vibe} style, ${combo.occasion}. Fashion flat lay on white background.`;
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: "realistic", aspectRatio: "1:1" }),
      });
      const data = await res.json();
      if (data.imageBase64) {
        setCombos(prev => prev.map(c =>
          c.id === combo.id
            ? { ...c, generatedImage: `data:${data.mimeType};base64,${data.imageBase64}` }
            : c
        ));
      }
    } catch { /* silent fail */ }
    finally { setGeneratingImageId(null); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Controls */}
      <div className="rounded-2xl border border-violet-200/60 overflow-hidden" style={{background:"linear-gradient(135deg,rgba(139,92,246,0.08) 0%,rgba(99,102,241,0.06) 50%,rgba(236,72,153,0.06) 100%)"}}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 blur-sm opacity-50" />
              <div className="relative rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 shadow-lg">
                <Brain size={18} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900 gradient-text">AI Stylist</h3>
              <p className="text-xs text-violet-500 font-medium">
                Phân tích {closet.length} món đồ và tư duy phối outfit
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 px-2.5 py-1 text-[10px] font-bold text-violet-700 border border-violet-200">
              ✨ SMART
            </div>
          </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Dịp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-violet-700">
              🎯 Dịp mặc
            </label>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-all duration-150 border",
                    occasion === o
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-sm shadow-violet-200"
                      : "bg-white border-violet-100 text-zinc-500 hover:border-violet-400 hover:text-violet-600"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Thời tiết */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-sky-700">
              🌤️ Thời tiết
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEATHERS.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-all duration-150 border",
                    weather === w
                      ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-transparent shadow-sm shadow-sky-200"
                      : "bg-white border-sky-100 text-zinc-500 hover:border-sky-400 hover:text-sky-600"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSuggest}
          disabled={isLoading || closet.length < 2}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
          style={{background: isLoading || closet.length < 2 ? "#a78bfa" : "linear-gradient(135deg,#8b5cf6,#6366f1,#ec4899)", boxShadow: "0 6px 20px rgba(139,92,246,0.35)"}}
        >
          <Brain size={16} />
          {isLoading
            ? "AI đang tư duy phối đồ..."
            : `✨ Phối đồ cho tôi (${closet.length} món)`}
        </button>

        {hasPersonalization && profileSummary && (
          <p className="mt-2 text-center text-xs text-violet-600 font-medium">
            🧠 {profileSummary}
          </p>
        )}

        {closet.length < 2 && (
          <p className="mt-2 text-center text-xs text-violet-400 font-medium">
            Thêm ít nhất 2 món đồ vào tủ để AI phối
          </p>
        )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-violet-100 bg-white py-12">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
            <Brain size={20} className="absolute inset-0 m-auto text-violet-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-violet-700">
              AI đang nhìn vào tủ đồ của bạn...
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Phân tích màu sắc, phong cách và tư duy phối đồ 🧠
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Combo results */}
      {combos.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-zinc-600">
            🎨 {combos.length} combo outfit cho dịp &quot;{occasion}&quot;
          </p>

          {combos.map((combo, idx) => {
            const comboItems = getComboItems(combo.items);
            const isExpanded = expandedId === combo.id;

            return (
              <div
                key={combo.id}
                className={cn(
                  "rounded-2xl border bg-white overflow-hidden transition-all",
                  isExpanded ? "border-violet-300 shadow-md" : "border-zinc-200"
                )}
              >
                {/* Combo header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : combo.id)
                  }
                  className="flex w-full items-center gap-4 p-4 text-left hover:bg-zinc-50 transition"
                >
                  {/* Rank badge */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      idx === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : idx === 1
                        ? "bg-zinc-100 text-zinc-600"
                        : "bg-orange-100 text-orange-700"
                    )}
                  >
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </div>

                  {/* Ảnh preview combo */}
                  <div className="flex -space-x-2">
                    {comboItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="relative h-10 w-10 rounded-full border-2 border-white bg-zinc-100 overflow-hidden"
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.type}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {comboItems.length > 3 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-xs font-medium text-zinc-600">
                        +{comboItems.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 truncate">
                        {combo.name}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          VIBE_COLORS[combo.vibe] || "bg-violet-100 text-violet-700"
                        )}
                      >
                        {combo.vibe}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {combo.occasion} • {comboItems.length} món
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-zinc-700">
                      {combo.score}/10
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp size={16} className="text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-zinc-400 shrink-0" />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 p-4 flex flex-col gap-4">
                    {/* Ảnh các món đồ */}
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {comboItems.map((item) => (
                        <div key={item.id} className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className="relative h-24 w-20 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">
                            <Image
                              src={item.imageUrl}
                              alt={item.type}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <p className="text-xs text-zinc-500 text-center max-w-[80px] truncate">
                            {item.type}
                          </p>
                          <p className="text-xs text-zinc-400">{item.color}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reasoning */}
                    <div className="rounded-xl bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-700 mb-1">
                        🧠 Tại sao hợp nhau?
                      </p>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        {combo.reasoning}
                      </p>
                    </div>

                    {/* Tips */}
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">
                        💡 Mẹo mặc thêm
                      </p>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        {combo.tips}
                      </p>
                    </div>

                    {/* Ảnh minh họa (tạo khi cần) */}
                    {combo.generatedImage ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative h-56 w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                          <Image
                            src={combo.generatedImage}
                            alt={combo.name}
                            fill
                            className="object-contain p-2"
                          />
                          <span className="absolute top-2 left-2 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-medium text-white">
                            ✨ AI minh họa
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateImage(combo)}
                        disabled={generatingImageId === combo.id}
                        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-100 disabled:opacity-50 transition"
                      >
                        {generatingImageId === combo.id ? (
                          <><Loader2 size={14} className="animate-spin" /> Đang tạo ảnh minh họa...</>
                        ) : (
                          <><ImagePlus size={14} /> Tạo ảnh minh họa outfit</>
                        )}
                      </button>
                    )}

                    {/* Try on button */}
                    {comboItems.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onTryOutfit(comboItems)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition"
                        >
                          <Wand2 size={14} />
                          Thử outfit này
                        </button>
                        {/* Feedback button */}
                        {combo.rated ? (
                          <div className="flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3 text-xs font-medium text-green-600">
                            ✅ Đã rate
                          </div>
                        ) : (
                          <button
                            onClick={() => setFeedbackComboId(combo.id)}
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-500 hover:border-violet-400 hover:text-violet-600 transition"
                          >
                            <MessageSquare size={14} />
                            Rate
                          </button>
                        )}
                      </div>
                    )}

                    {/* Feedback panel */}
                    {feedbackComboId === combo.id && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
                        <OutfitFeedback
                          outfitId={combo.savedId || combo.id}
                          outfitName={combo.name}
                          onSubmit={(rating, feedback, worn) =>
                            handleFeedback(combo, rating, feedback, worn)
                          }
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

      {/* Empty state khi chưa suggest */}
      {!isLoading && combos.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 py-12" style={{background:"linear-gradient(135deg,rgba(245,243,255,0.8),rgba(253,242,248,0.8))"}}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 p-5 shadow-inner">
            <Sparkles size={28} className="text-violet-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-violet-700">
              AI chưa phân tích tủ đồ
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Nhấn &quot;Phối đồ cho tôi&quot; để AI tư duy outfit từ tủ đồ của bạn
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
