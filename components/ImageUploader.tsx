"use client";

import { useRef, useState } from "react";
import { Upload, X, Camera } from "lucide-react";
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
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // result = "data:image/jpeg;base64,xxxx"
      const base64 = result.split(",")[1];
      onImageChange(base64, file.type, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
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

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden",
          "min-h-[220px] bg-zinc-50 hover:bg-zinc-100",
          dragging
            ? "border-violet-500 bg-violet-50"
            : "border-zinc-200 hover:border-violet-400"
        )}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="preview"
              fill
              className="object-contain p-2"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 z-10 rounded-full bg-white/80 p-1 shadow hover:bg-red-50 transition"
            >
              <X size={16} className="text-zinc-500" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="rounded-full bg-violet-100 p-4">
              {dragging ? (
                <Camera size={28} className="text-violet-500" />
              ) : (
                <Upload size={28} className="text-violet-400" />
              )}
            </div>
            <p className="text-sm text-zinc-500">
              Kéo thả hoặc <span className="text-violet-600 font-medium">chọn ảnh</span>
            </p>
            <p className="text-xs text-zinc-400">JPG, PNG, WEBP</p>
          </div>
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
