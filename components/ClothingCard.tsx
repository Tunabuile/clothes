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
  New: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Mới: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Good: "bg-sky-50 text-sky-700 border-sky-200",
  "Còn tốt": "bg-sky-50 text-sky-700 border-sky-200",
  Worn: "bg-amber-50 text-amber-700 border-amber-200",
  Cũ: "bg-amber-50 text-amber-700 border-amber-200",
};

// Assign a gradient per item based on its id (deterministic)
const CARD_GRADIENTS = [
  "from-violet-50 to-purple-50",
  "from-pink-50 to-rose-50",
  "from-sky-50 to-blue-50",
  "from-emerald-50 to-teal-50",
  "from-amber-50 to-orange-50",
  "from-indigo-50 to-violet-50",
];
function getCardGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

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

  const conditionKeys: Record<string, string> = {
    "New": "closet.condition.new",
    "Mới": "closet.condition.new",
    "Good": "closet.condition.good",
    "Còn tốt": "closet.condition.good",
    "Worn": "closet.condition.worn",
    "Cũ": "closet.condition.worn",
  };
  const translatedCondition = t(conditionKeys[item.condition] || "closet.condition.good");

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1",
        isSelected ? "border-violet-400 ring-2 ring-violet-200 shadow-violet-100" : "hover:border-violet-300",
        isDusty && "border-amber-300"
      )}
      style={{background:"var(--surface)", borderColor: isSelected ? undefined : "var(--border-card)"}}
    >
      {/* Colored gradient top strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", isSelected ? "from-violet-500 to-pink-500" : "from-transparent via-violet-200 to-transparent opacity-0 group-hover:opacity-100")} style={{transition:"opacity 0.3s"}} />

      <div className={cn("relative aspect-[4/5]", `bg-gradient-to-b ${getCardGradient(item.id)}`)}>
        <Image
          src={item.imageUrl}
          alt={item.type}
          fill
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 20vw"
        />

        {isDusty && (
          <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {t("closet.dusty")}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-900/40 opacity-0 backdrop-blur-[3px] transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onTryOn(item)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-violet-300 duration-150"
          >
            <Wand2 size={13} />
            {t("closet.tryon")}
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-full bg-white/90 p-2 text-zinc-600 shadow-lg transition hover:bg-red-50 hover:text-red-600 hover:scale-105 duration-150"
            aria-label={t("closet.delete")}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t p-3.5" style={{borderColor:"var(--border-card)", background:"var(--surface)"}}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Shirt size={13} className="shrink-0 text-violet-400" />
            <h3 className="truncate text-sm font-bold" style={{color:"var(--text-base)"}}>{item.type}</h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border",
              conditionStyle[item.condition] || "bg-zinc-100 text-zinc-600 border-zinc-200"
            )}
          >
            {translatedCondition}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
            {item.color}
          </span>
          <span className="rounded-lg bg-gradient-to-r from-zinc-50 to-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            {item.material}
          </span>
          <span className="rounded-lg bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 px-2 py-0.5 text-[11px] font-semibold text-pink-600">
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
