"use client";

import Image from "next/image";
import { Shirt, Trash2, Wand2, Calendar } from "lucide-react";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface ClothingCardProps {
  item: ClothingItem;
  onTryOn: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

const conditionStyle: Record<string, string> = {
  New: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Mới: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Good: "bg-sky-50 text-sky-700 ring-sky-200",
  "Còn tốt": "bg-sky-50 text-sky-700 ring-sky-200",
  Worn: "bg-amber-50 text-amber-700 ring-amber-200",
  Cũ: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function ClothingCard({
  item,
  onTryOn,
  onDelete,
  isSelected,
}: ClothingCardProps) {
  const { t } = useI18n();
  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(item.addedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isDusty = daysSinceAdded > 90 && item.tryOnCount === 0;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        isSelected ? "border-violet-400 ring-2 ring-violet-200" : "border-zinc-200/90",
        isDusty && "border-amber-200"
      )}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-b from-zinc-50 to-white">
        <Image
          src={item.imageUrl}
          alt={item.type}
          fill
          className="object-contain p-4"
          sizes="(max-width: 640px) 50vw, 20vw"
        />

        {isDusty && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            {t("closet.dusty")}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-900/45 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onTryOn(item)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
            <Wand2 size={14} />
            {t("closet.tryon")}
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-full bg-white/90 p-2 text-zinc-600 shadow-lg transition hover:bg-red-50 hover:text-red-600"
            aria-label={t("closet.delete")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-zinc-100 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Shirt size={14} className="shrink-0 text-zinc-400" />
            <h3 className="truncate text-sm font-semibold text-zinc-900">{item.type}</h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
              conditionStyle[item.condition] || "bg-zinc-100 text-zinc-600 ring-zinc-200"
            )}
          >
            {item.condition}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {item.color}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {item.material}
          </span>
          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            {item.style}
          </span>
        </div>

        <p className="flex items-center gap-1 text-[11px] text-zinc-400">
          <Calendar size={11} />
          {t("closet.tried", { count: item.tryOnCount })}
        </p>
      </div>
    </article>
  );
}
