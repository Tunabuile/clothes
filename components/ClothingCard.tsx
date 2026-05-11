"use client";

import Image from "next/image";
import { Shirt, Trash2, Wand2 } from "lucide-react";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ClothingCardProps {
  item: ClothingItem;
  onTryOn: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

const conditionColor: Record<string, string> = {
  New: "bg-green-100 text-green-700",
  Good: "bg-blue-100 text-blue-700",
  Worn: "bg-yellow-100 text-yellow-700",
};

export default function ClothingCard({
  item,
  onTryOn,
  onDelete,
  isSelected,
}: ClothingCardProps) {
  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(item.addedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isDusty = daysSinceAdded > 90 && item.tryOnCount === 0;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-md",
        isSelected
          ? "border-violet-500 ring-2 ring-violet-300"
          : "border-zinc-200",
        isDusty && "border-orange-300"
      )}
    >
      {/* Ảnh đồ */}
      <div className="relative h-44 bg-zinc-50">
        <Image
          src={item.imageUrl}
          alt={item.type}
          fill
          className="object-contain p-3"
        />

        {/* Badge bốc bụi */}
        {isDusty && (
          <div className="absolute top-2 left-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
            🌫️ Bốc bụi rồi!
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTryOn(item)}
            className="flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition"
          >
            <Wand2 size={13} />
            Thử đồ
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="rounded-full bg-white/20 p-1.5 text-white hover:bg-red-500 transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shirt size={13} className="text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-800">
              {item.type}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              conditionColor[item.condition] || "bg-zinc-100 text-zinc-600"
            )}
          >
            {item.condition}
          </span>
        </div>

        <div className="flex gap-2 text-xs text-zinc-400">
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: item.color.toLowerCase() === "white" ? "#f4f4f5" : item.color.toLowerCase() === "black" ? "#18181b" : "#f4f4f5", color: item.color.toLowerCase() === "black" ? "#fff" : "#52525b" }}
          >
            {item.color}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5">
            {item.material}
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Đã thử: {item.tryOnCount} lần
        </p>
      </div>
    </div>
  );
}
