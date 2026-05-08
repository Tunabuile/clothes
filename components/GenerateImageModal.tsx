"use client";

import { useState } from "react";
import { Sparkles, X, Wand2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface GenerateImageModalProps {
  onClose: () => void;
  onUseImage: (base64: string, mimeType: string, previewUrl: string) => void;
}

const STYLES = [
  { id: "realistic", label: "📸 Thực tế", desc: "Ảnh chụp studio" },
  { id: "anime", label: "🎨 Anime", desc: "Phong cách hoạt hình" },
  { id: "sketch", label: "✏️ Phác thảo", desc: "Bản vẽ thiết kế" },
  { id: "watercolor", label: "🖌️ Màu nước", desc: "Tranh nghệ thuật" },
];

const QUICK_PROMPTS = [
  "Áo thun trắng basic cổ tròn",
  "Quần jeans xanh slim fit",
  "Váy hoa nhí màu pastel",
  "Áo khoác bomber đen",
  "Áo sơ mi kẻ sọc xanh trắng",
  "Quần short kaki be",
];

export default function GenerateImageModal({
  onClose,
  onUseImage,
}: GenerateImageModalProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultBase64, setResultBase64] = useState("");
  const [resultMime, setResultMime] = useState("image/png");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setResultBase64("");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, aspectRatio: "1:1" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setResultBase64(data.imageBase64);
      setResultMime(data.mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo ảnh");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = () => {
    if (!resultBase64) return;
    const previewUrl = `data:${resultMime};base64,${resultBase64}`;
    onUseImage(resultBase64, resultMime, previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-pink-500 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Sparkles size={20} className="text-white" />
            <div>
              <h2 className="font-bold text-white">Tạo ảnh đồ bằng AI</h2>
              <p className="text-xs text-violet-200">Gemini Image Generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Prompt input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700">
              Mô tả món đồ bạn muốn tạo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="VD: Áo thun trắng basic cổ tròn..."
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Wand2 size={15} />
                {isGenerating ? "Đang tạo..." : "Tạo"}
              </button>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:border-violet-400 hover:text-violet-600 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Style selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700">
              Phong cách
            </label>
            <div className="grid grid-cols-4 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition",
                    style === s.id
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-zinc-200 text-zinc-500 hover:border-violet-300"
                  )}
                >
                  <span className="text-lg">{s.label.split(" ")[0]}</span>
                  <span className="text-xs font-medium">
                    {s.label.split(" ").slice(1).join(" ")}
                  </span>
                  <span className="text-xs text-zinc-400">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-3">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-violet-50 py-12">
                <div className="h-12 w-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                <p className="text-sm font-medium text-violet-600">
                  Gemini đang vẽ đồ cho bạn... ✨
                </p>
              </div>
            ) : resultBase64 ? (
              <div className="flex flex-col gap-3">
                <div className="relative h-64 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <Image
                    src={`data:${resultMime};base64,${resultBase64}`}
                    alt="AI Generated clothing"
                    fill
                    className="object-contain p-2"
                  />
                  <div className="absolute top-2 left-2 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-medium text-white">
                    ✨ AI Generated
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUse}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition"
                  >
                    <ImageIcon size={15} />
                    Dùng ảnh này để thử đồ
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
                  >
                    <Wand2 size={15} />
                    Tạo lại
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 py-10">
                <Sparkles size={28} className="text-zinc-300" />
                <p className="text-sm text-zinc-400">
                  Nhập mô tả và nhấn &quot;Tạo&quot; để AI vẽ đồ cho bạn
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
