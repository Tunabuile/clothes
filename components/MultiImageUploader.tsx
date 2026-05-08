"use client";

import { useRef } from "react";
import { Upload, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface UploadedImage {
  id: string;
  base64: string;
  mimeType: string;
  previewUrl: string;
  name?: string;
}

interface MultiImageUploaderProps {
  label: string;
  hint?: string;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export default function MultiImageUploader({
  label,
  hint,
  images,
  onChange,
  maxImages = 10,
  className,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const remaining = maxImages - images.length;
    const toProcess = fileArray.slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          base64,
          mimeType: file.type,
          previewUrl: result,
          name: file.name,
        };
        onChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-700">{label}</label>
        {images.length > 0 && (
          <span className="text-xs text-zinc-400">
            {images.length}/{maxImages} ảnh
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}

      {/* Grid preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group"
            >
              <Image
                src={img.previewUrl}
                alt="clothing"
                fill
                className="object-contain p-1"
              />
              <button
                onClick={() => handleRemove(img.id)}
                className="absolute top-1 right-1 z-10 rounded-full bg-white/90 p-0.5 shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
              >
                <X size={13} className="text-zinc-500" />
              </button>
            </div>
          ))}

          {/* Add more button */}
          {canAddMore && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-violet-400 hover:bg-violet-50 transition flex flex-col items-center justify-center gap-1"
            >
              <Plus size={20} className="text-zinc-400" />
              <span className="text-xs text-zinc-400">Thêm</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone (chỉ hiện khi chưa có ảnh) */}
      {images.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100 transition"
          >
            <Upload size={18} />
            Tải ảnh lên
          </button>
          <p className="text-xs text-zinc-400 text-center">
            Chọn nhiều ảnh quần áo cùng lúc để AI nhận diện thông minh
          </p>
        </div>
      )}

      {images.length > 0 && canAddMore && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-3 text-center text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            + Tải thêm ảnh
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
