"use client";

import { useState } from "react";
import { Recycle, Scan, Leaf, Clock, Wrench, Heart, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Image from "next/image";
import ImageUploader from "./ImageUploader";
import { cn } from "@/lib/utils";

interface Material {
  name: string;
  percent: number;
  eco: boolean;
}

interface RecycleSuggestion {
  title: string;
  difficulty: string;
  time: string;
  description: string;
  materials_needed: string[];
  category: string;
}

interface LabelData {
  materials: Material[];
  careInstructions: string[];
  madeIn: string;
  brand: string;
  ecoScore: number;
  recycleSuggestions: RecycleSuggestion[];
  sustainabilityTips: string[];
  decompositionTime: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Tái chế": "bg-green-100 text-green-700 border-green-200",
  "Tái sử dụng": "bg-blue-100 text-blue-700 border-blue-200",
  "Donate": "bg-pink-100 text-pink-700 border-pink-200",
  "Upcycle": "bg-violet-100 text-violet-700 border-violet-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "Rất dễ": "text-green-600",
  "Dễ": "text-blue-600",
  "Trung bình": "text-yellow-600",
  "Khó": "text-red-500",
};

function EcoScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 rounded-full bg-zinc-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-lg font-bold w-10 text-right",
        score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-500"
      )}>{score}</span>
    </div>
  );
}

export default function LabelScanner() {
  const [imageBase64, setImageBase64] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imagePreview, setImagePreview] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [data, setData] = useState<LabelData | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleScan = async () => {
    if (!imageBase64) return;
    setIsScanning(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(result.data);
      setExpandedId(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi scan tem");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload + Scan */}
      <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-xl bg-green-600 p-2">
            <Recycle size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">Scan Tem Thành Phần</h3>
            <p className="text-xs text-zinc-400">
              Chụp tem áo → AI đọc chất liệu → gợi ý tái chế
            </p>
          </div>
        </div>

        <ImageUploader
          label="📸 Chụp tem thành phần áo"
          hint="Chụp rõ tem bên trong cổ áo hoặc sườn áo"
          previewUrl={imagePreview}
          onImageChange={(b64, mime, preview) => {
            setImageBase64(b64);
            setImageMime(mime);
            setImagePreview(preview);
          }}
        />

        <button
          onClick={handleScan}
          disabled={!imageBase64 || isScanning}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isScanning ? (
            <><Loader2 size={15} className="animate-spin" /> AI đang đọc tem...</>
          ) : (
            <><Scan size={15} /> Scan & Gợi ý tái chế</>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="flex flex-col gap-5">

          {/* Materials + Eco Score */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={16} className="text-green-500" />
              <p className="font-semibold text-zinc-800">Thành phần chất liệu</p>
            </div>

            {/* Material bars */}
            <div className="flex flex-col gap-2 mb-4">
              {data.materials.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", m.eco ? "bg-green-500" : "bg-orange-400")} />
                  <span className="text-sm text-zinc-700 w-28 shrink-0">{m.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", m.eco ? "bg-green-400" : "bg-orange-400")}
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-zinc-600 w-10 text-right">{m.percent}%</span>
                  {m.eco && <span className="text-xs text-green-600">🌿</span>}
                </div>
              ))}
            </div>

            {/* Eco score */}
            <div className="border-t border-zinc-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-600">Điểm thân thiện môi trường</p>
                <span className="text-xs text-zinc-400">
                  {data.ecoScore >= 70 ? "🌿 Tốt" : data.ecoScore >= 40 ? "⚠️ Trung bình" : "❌ Kém"}
                </span>
              </div>
              <EcoScoreBar score={data.ecoScore} />
            </div>

            {/* Info row */}
            <div className="mt-4 flex flex-wrap gap-3">
              {data.madeIn && (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                  🏭 Made in {data.madeIn}
                </span>
              )}
              {data.brand && (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                  🏷️ {data.brand}
                </span>
              )}
              {data.decompositionTime && (
                <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs text-red-600">
                  ⏳ Phân hủy: {data.decompositionTime}
                </span>
              )}
            </div>
          </div>

          {/* Care instructions */}
          {data.careInstructions?.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-700 mb-3">🧺 Hướng dẫn giặt ủi</p>
              <div className="flex flex-wrap gap-2">
                {data.careInstructions.map((c, i) => (
                  <span key={i} className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs text-blue-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recycle suggestions - Forum card style */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Recycle size={16} className="text-green-500" />
              <p className="font-semibold text-zinc-800">
                💡 {data.recycleSuggestions.length} gợi ý tái chế
              </p>
            </div>

            {/* Grid layout giống forum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.recycleSuggestions.map((s, idx) => {
                const isExpanded = expandedId === idx;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-2xl border bg-white overflow-hidden transition-all cursor-pointer hover:shadow-md",
                      isExpanded ? "border-green-300 shadow-md" : "border-zinc-200"
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : idx)}
                  >
                    {/* Card header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-zinc-900">{s.title}</p>
                        <span className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                          CATEGORY_COLORS[s.category] || "bg-zinc-100 text-zinc-600 border-zinc-200"
                        )}>
                          {s.category}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-500 line-clamp-2">{s.description}</p>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1">
                          <Wrench size={12} className="text-zinc-400" />
                          <span className={cn("text-xs font-medium", DIFFICULTY_COLORS[s.difficulty] || "text-zinc-500")}>
                            {s.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-zinc-400" />
                          <span className="text-xs text-zinc-500">{s.time}</span>
                        </div>
                        {s.materials_needed.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Heart size={12} className="text-zinc-400" />
                            <span className="text-xs text-zinc-500">{s.materials_needed.length} dụng cụ</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 p-4 bg-zinc-50 flex flex-col gap-3">
                        <p className="text-sm text-zinc-700 leading-relaxed">{s.description}</p>
                        {s.materials_needed.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-zinc-600 mb-1.5">🔧 Cần chuẩn bị:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {s.materials_needed.map((m, i) => (
                                <span key={i} className="rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expand indicator */}
                    <div className="flex justify-center pb-2">
                      {isExpanded
                        ? <ChevronUp size={14} className="text-zinc-300" />
                        : <ChevronDown size={14} className="text-zinc-300" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sustainability tips */}
          {data.sustainabilityTips?.length > 0 && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-700 mb-3">🌿 Mẹo bảo quản bền vững</p>
              <ul className="flex flex-col gap-1.5">
                {data.sustainabilityTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data && !isScanning && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-12">
          <div className="rounded-full bg-green-50 p-5">
            <Recycle size={28} className="text-green-300" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-zinc-500">Chưa scan tem nào</p>
            <p className="text-sm text-zinc-400 mt-1">
              Chụp tem thành phần áo → AI đọc chất liệu → gợi ý tái chế
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
