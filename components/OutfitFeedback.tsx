"use client";

import { useState } from "react";
import { Star, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutfitFeedbackProps {
  outfitId: string;
  outfitName: string;
  onSubmit: (rating: number, feedback: string, worn: boolean) => void;
  onClose: () => void;
}

const FEEDBACK_OPTIONS = [
  "Hợp lắm! 🔥",
  "Màu sắc đẹp",
  "Phong cách đúng ý",
  "Không hợp màu",
  "Quá formal",
  "Quá casual",
  "Chất liệu không hợp",
  "Sẽ mặc thử",
];

export default function OutfitFeedback({
  outfitId,
  outfitName,
  onSubmit,
  onClose,
}: OutfitFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [worn, setWorn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, selectedFeedback.join(", "), worn);
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <CheckCircle size={40} className="text-green-500" />
        <p className="font-semibold text-zinc-800">Cảm ơn! AI đã ghi nhận 🧠</p>
        <p className="text-sm text-zinc-400">
          Feedback của bạn giúp AI phối đồ chuẩn hơn
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-zinc-800">Đánh giá outfit</p>
          <p className="text-xs text-zinc-400">{outfitName}</p>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100">
          <X size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Star rating */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-600">Outfit này hợp bạn không?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={cn(
                  "transition-colors",
                  (hoverRating || rating) >= star
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-zinc-200"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center text-sm text-zinc-500">
              {["", "Không hợp", "Tạm được", "Ổn", "Đẹp!", "Xuất sắc! 🔥"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Quick feedback tags */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-600">Chi tiết (chọn nhiều):</p>
        <div className="flex flex-wrap gap-1.5">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() =>
                setSelectedFeedback((prev) =>
                  prev.includes(opt) ? prev.filter((f) => f !== opt) : [...prev, opt]
                )
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                selectedFeedback.includes(opt)
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Worn toggle */}
      <button
        onClick={() => setWorn(!worn)}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
          worn
            ? "border-green-400 bg-green-50 text-green-700"
            : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
        )}
      >
        <CheckCircle size={15} className={worn ? "text-green-500" : "text-zinc-300"} />
        {worn ? "Đã mặc thật rồi ✓" : "Tôi đã mặc outfit này ngoài đời"}
      </button>

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Gửi feedback cho AI
      </button>

      <p className="text-center text-xs text-zinc-400">
        🧠 AI sẽ học từ feedback này để phối đồ chuẩn hơn cho bạn
      </p>
    </div>
  );
}

// ID dùng để track outfit đang feedback
export { outfitId };
function outfitId(id: string) { return id; }
