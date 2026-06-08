"use client";

import { getBMI, getBodyType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface BodyFormProps {
  height: number;
  weight: number;
  onChange: (field: "height" | "weight", value: number) => void;
}

export default function BodyForm({ height, weight, onChange }: BodyFormProps) {
  const { t } = useI18n();
  const bmi = height > 0 && weight > 0 ? getBMI(height, weight) : null;
  const bodyType = bmi ? getBodyType(bmi) : null;

  const bmiColor = bmi === null ? "text-zinc-400" : bmi < 18.5 ? "text-blue-500" : bmi < 23 ? "text-green-500" : bmi < 27.5 ? "text-yellow-500" : "text-red-500";

  const bodyTypeKeys: Record<string, string> = {
    "Gầy": "tryon.bmi.underweight",
    "Bình thường": "tryon.bmi.normal",
    "Thừa cân": "tryon.bmi.overweight",
    "Béo phì": "tryon.bmi.obese",
  };

  const translatedBodyType = bodyType ? t(bodyTypeKeys[bodyType] || "tryon.bmi.normal") : "";

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2" style={{color:"var(--text-base)"}}>
        <span className="w-1.5 h-5 bg-violet-500 rounded-full" />
        {t("tryon.height")} & {t("tryon.weight")}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium" style={{color:"var(--text-muted)"}}>{t("tryon.height")} (cm)</label>
          <input type="number" min={100} max={250} value={height || ""}
            onChange={(e) => onChange("height", Number(e.target.value))} placeholder="170" className="input-modern" />
          <input type="range" min={140} max={210} value={height || 170}
            onChange={(e) => onChange("height", Number(e.target.value))} className="w-full accent-violet-500" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium" style={{color:"var(--text-muted)"}}>{t("tryon.weight")} (kg)</label>
          <input type="number" min={30} max={200} value={weight || ""}
            onChange={(e) => onChange("weight", Number(e.target.value))} placeholder="60" className="input-modern" />
          <input type="range" min={30} max={150} value={weight || 60}
            onChange={(e) => onChange("weight", Number(e.target.value))} className="w-full accent-violet-500" />
        </div>
      </div>

      {bmi && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{background:"var(--surface)", border:"1px solid var(--border-card)"}}>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider" style={{color:"var(--text-muted)"}}>BMI</p>
            <p className={cn("text-2xl font-black", bmiColor)}>{bmi}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider" style={{color:"var(--text-muted)"}}>{t("tryon.bmi.status")}</p>
            <p className={cn("text-sm font-bold mt-1", bmiColor)}>{translatedBodyType}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider" style={{color:"var(--text-muted)"}}>{t("tryon.height")}</p>
            <p className="text-sm font-bold mt-1" style={{color:"var(--text-base)"}}>{height} cm</p>
          </div>
        </div>
      )}
    </div>
  );
}