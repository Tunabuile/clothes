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
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/80 to-white px-6">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-[3px] border-violet-100 border-t-violet-600 animate-spin" />
          <Sparkles size={18} className="absolute inset-0 m-auto text-violet-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-violet-900">{t("tryon.button.loading")}</p>
          <p className="mt-1 text-sm text-violet-500">{t("tryon.result.loading.hint")}</p>
        </div>
      </div>
    );
  }

  if (!resultText) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 text-center">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
          <MessageSquareText size={32} className="text-zinc-300" />
        </div>
        <p className="font-medium text-zinc-600">{t("tryon.result.empty")}</p>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-400">{t("tryon.result.empty.hint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
          <Sparkles size={18} className="text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{t("tryon.result")}</p>
          <p className="text-xs text-zinc-500">{t("tryon.result.subtitle")}</p>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto rounded-xl bg-zinc-50/80 p-4 ring-1 ring-zinc-100">
        <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">{resultText}</p>
      </div>
    </div>
  );
}
