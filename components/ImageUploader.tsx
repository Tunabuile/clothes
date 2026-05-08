"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploaderProps {
  label: string;
  hint?: string;
  onImageChange: (base64: string, mimeType: string, previewUrl: string) => void;
  previewUrl?: string;
  className?: string;
}

export default function ImageUploader({
  label,
  hint,
  onImageChange,
  previewUrl,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1];
      onImageChange(base64, file.type, result);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange("", "", "");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-semibold text-zinc-700">{label}</label>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}

      <div className="flex flex-col gap-2">
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
            <Image
              src={previewUrl}
              alt="preview"
              width={320}
              height={220}
              className="object-contain"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-red-50 transition"
            >
              <X size={16} className="text-zinc-600" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm hover:border-violet-300 hover:bg-violet-50 transition"
          >
            <Upload size={18} />
            Tải ảnh lên
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
