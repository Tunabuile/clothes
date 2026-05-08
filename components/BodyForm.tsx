"use client";

import { getBMI, getBodyType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BodyFormProps {
  height: number;
  weight: number;
  onChange: (field: "height" | "weight", value: number) => void;
}

export default function BodyForm({ height, weight, onChange }: BodyFormProps) {
  const bmi = height > 0 && weight > 0 ? getBMI(height, weight) : null;
  const bodyType = bmi ? getBodyType(bmi) : null;

  const bmiColor =
    bmi === null
      ? "text-zinc-400"
      : bmi < 18.5
      ? "text-blue-500"
      : bmi < 25
      ? "text-green-500"
      : bmi < 30
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col gap-4">
      <h3 className="font-semibold text-zinc-800 text-sm">📏 Thông số cơ thể</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Chiều cao */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Chiều cao (cm)
          </label>
          <input
            type="number"
            min={100}
            max={250}
            value={height || ""}
            onChange={(e) => onChange("height", Number(e.target.value))}
            placeholder="170"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
          />
          {/* Slider */}
          <input
            type="range"
            min={140}
            max={210}
            value={height || 170}
            onChange={(e) => onChange("height", Number(e.target.value))}
            className="accent-violet-500"
          />
        </div>

        {/* Cân nặng */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">
            Cân nặng (kg)
          </label>
          <input
            type="number"
            min={30}
            max={200}
            value={weight || ""}
            onChange={(e) => onChange("weight", Number(e.target.value))}
            placeholder="60"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
          />
          <input
            type="range"
            min={30}
            max={150}
            value={weight || 60}
            onChange={(e) => onChange("weight", Number(e.target.value))}
            className="accent-violet-500"
          />
        </div>
      </div>

      {/* BMI display */}
      {bmi && (
        <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
          <div>
            <p className="text-xs text-zinc-400">Chỉ số BMI</p>
            <p className={cn("text-2xl font-bold", bmiColor)}>{bmi}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Phân loại</p>
            <p className={cn("text-sm font-semibold", bmiColor)}>{bodyType}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">Chiều cao</p>
            <p className="text-sm font-semibold text-zinc-700">{height} cm</p>
          </div>
        </div>
      )}
    </div>
  );
}
