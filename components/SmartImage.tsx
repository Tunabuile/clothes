"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SmartImageProps {
  query: string;       // từ khóa tìm ảnh
  fallback?: string;   // ảnh dự phòng nếu không tìm được
  alt: string;
  className?: string;
}

// Cache để không gọi API nhiều lần cho cùng query
const imageCache: Record<string, string> = {};

export default function SmartImage({ query, fallback, alt, className }: SmartImageProps) {
  const [src, setSrc] = useState<string>(fallback || "");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imageCache[query]) {
      setSrc(imageCache[query]);
      return;
    }

    fetch(`/api/unsplash-image?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          imageCache[query] = data.url;
          setSrc(data.url);
        }
      })
      .catch(() => {});
  }, [query]);

  if (!src) {
    return (
      <div className={`bg-zinc-100 flex items-center justify-center ${className}`}>
        <span className="text-2xl">♻️</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-100 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
