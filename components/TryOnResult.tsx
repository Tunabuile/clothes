"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

interface TryOnResultProps {
  resultText: string;
  generatedImageUrl: string;
  isLoading: boolean;
  isGeneratingImage: boolean;
  onGenerateImage?: () => void;
}

export default function TryOnResult({
  resultText,
  generatedImageUrl,
  isLoading,
  isGeneratingImage,
  onGenerateImage,
}: TryOnResultProps) {

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 min-h-[240px] sm:min-h-[320px]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          <Sparkles
            size={20}
            className="absolute inset-0 m-auto text-violet-500"
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-violet-700">AI đang xử lý...</p>
          <p className="text-sm text-violet-400 mt-1">
            Khoảng 10–30 giây, chờ tí nhé 🪄
          </p>
        </div>
      </div>
    );
  }

  if (!resultText) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 min-h-[240px] sm:min-h-[320px]">
        <div className="rounded-full bg-zinc-100 p-5">
          <Sparkles size={32} className="text-zinc-300" />
        </div>
        <p className="text-sm text-zinc-400">Kết quả sẽ hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 min-h-[220px] sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 mb-3">
          ✨ Kết quả bằng văn bản
        </p>
        <div className="whitespace-pre-line text-sm leading-6 text-zinc-700">
          {resultText}
        </div>
      </div>

      {generatedImageUrl ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
          <div className="relative h-56 sm:h-72">
            <Image
              src={generatedImageUrl}
              alt="Ảnh minh họa outfit"
              fill
              className="object-contain"
            />
          </div>
        </div>
      ) : (
        <button
          onClick={onGenerateImage}
          disabled={!onGenerateImage || isGeneratingImage}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isGeneratingImage ? "Đang tạo ảnh..." : "Tạo ảnh minh họa"}
        </button>
      )}
    </div>
  );
}
