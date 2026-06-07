"use client";

import { Sparkles, MessageSquareText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface TryOnResultProps {
  resultText: string;
  isLoading: boolean;
}

export default function TryOnResult({ resultText, isLoading }: TryOnResultProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-sky-200 px-6" style={{background:"linear-gradient(135deg,rgba(224,242,254,0.6),rgba(219,234,254,0.5))"}}>
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-[3px] border-sky-100 border-t-sky-500 animate-spin" />
          <Sparkles size={18} className="absolute inset-0 m-auto text-sky-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-sky-800">{t("tryon.button.loading")}</p>
          <p className="mt-1 text-sm text-sky-500">{t("tryon.result.loading.hint")}</p>
        </div>
      </div>
    );
  }

  if (!resultText) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 px-6 text-center" style={{background:"rgba(249,250,251,0.7)"}}>
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 p-4 shadow-sm ring-1 ring-sky-100">
          <MessageSquareText size={32} className="text-sky-300" />
        </div>
        <p className="font-semibold text-zinc-600">{t("tryon.result.empty")}</p>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-400">{t("tryon.result.empty.hint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-sky-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100">
          <Sparkles size={18} className="text-sky-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900">{t("tryon.result")}</p>
          <p className="text-xs text-sky-500">{t("tryon.result.subtitle")}</p>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto rounded-xl bg-gradient-to-b from-sky-50/50 to-indigo-50/30 p-4 ring-1 ring-sky-100">
        <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">{resultText}</p>
      </div>
    </div>
  );
}
