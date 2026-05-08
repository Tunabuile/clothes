"use client";

import Image from "next/image";
import { Download, RefreshCw, Sparkles } from "lucide-react";

interface TryOnResultProps {
  resultImageUrl: string;
  isLoading: boolean;
  onRetry?: () => void;
}

export default function TryOnResult({
  resultImageUrl,
  isLoading,
  onRetry,
}: TryOnResultProps) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = resultImageUrl;
    a.download = `fitai-tryon-${Date.now()}.jpg`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 min-h-[320px]">
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

  if (!resultImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 min-h-[320px]">
        <div className="rounded-full bg-zinc-100 p-5">
          <Sparkles size={32} className="text-zinc-300" />
        </div>
        <p className="text-sm text-zinc-400">Kết quả sẽ hiện ở đây</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 min-h-[320px]">
        <Image
          src={resultImageUrl}
          alt="Virtual Try-On Result"
          fill
          className="object-contain"
        />
        <div className="absolute top-3 left-3 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow">
          ✨ Kết quả AI
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition"
        >
          <Download size={15} />
          Tải ảnh
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
          >
            <RefreshCw size={15} />
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}
