"use client";

import { useState, useEffect } from "react";
import { Brain, RefreshCw, Sparkles, TrendingUp, Heart, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleProfile {
  total_outfits: number;
  avg_rating: number;
  top_colors: string[];
  top_styles: string[];
  top_occasions: string[];
  liked_combos: string[];
  disliked_combos: string[];
  personality_tags: string[];
  style_summary?: string;
  last_updated: string;
}

export default function AIStyleProfile() {
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/train-style");
      const data = await res.json();
      if (data.profile) setProfile(data.profile);
    } catch {
      // profile chưa có, bỏ qua
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainMsg("");
    setError("");
    try {
      const res = await fetch("/api/train-style", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrainMsg(data.summary);
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi train AI");
    } finally {
      setIsTraining(false);
    }
  };

  const ratingColor = (r: number) =>
    r >= 4 ? "text-green-600" : r >= 3 ? "text-yellow-600" : "text-red-500";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-600 p-2">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">AI Style Profile</h3>
              <p className="text-xs text-zinc-400">
                AI học từ feedback của bạn để phối đồ chuẩn hơn
              </p>
            </div>
          </div>
          <button
            onClick={fetchProfile}
            disabled={isLoading}
            className="rounded-full p-2 hover:bg-violet-100 transition"
          >
            <RefreshCw size={15} className={cn("text-violet-500", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Train button */}
        <button
          onClick={handleTrain}
          disabled={isTraining}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition"
        >
          <Brain size={15} />
          {isTraining ? "AI đang học từ feedback của bạn..." : "🧠 Train AI từ lịch sử của tôi"}
        </button>

        {trainMsg && (
          <div className="mt-3 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            ✅ {trainMsg}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Profile display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
        </div>
      ) : profile ? (
        <div className="flex flex-col gap-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{profile.total_outfits}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Outfit đã rate</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
              <p className={cn("text-2xl font-bold", ratingColor(profile.avg_rating))}>
                {profile.avg_rating?.toFixed(1)}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">Rating TB</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-pink-500">
                {profile.personality_tags?.length || 0}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">Style tags</p>
            </div>
          </div>

          {/* Style summary */}
          {profile.style_summary && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-violet-500" />
                <p className="text-xs font-semibold text-violet-700">AI nhận xét về phong cách của bạn</p>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed">{profile.style_summary}</p>
            </div>
          )}

          {/* Personality tags */}
          {profile.personality_tags?.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-violet-500" />
                <p className="text-xs font-semibold text-zinc-700">Phong cách của bạn</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.personality_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Liked vs Disliked */}
          <div className="grid grid-cols-2 gap-3">
            {profile.liked_combos?.length > 0 && (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart size={13} className="text-green-500 fill-green-500" />
                  <p className="text-xs font-semibold text-green-700">Hay phối</p>
                </div>
                <div className="flex flex-col gap-1">
                  {profile.liked_combos.slice(0, 3).map((c) => (
                    <p key={c} className="text-xs text-zinc-600">• {c}</p>
                  ))}
                </div>
              </div>
            )}
            {profile.disliked_combos?.length > 0 && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <XIcon size={13} className="text-red-500" />
                  <p className="text-xs font-semibold text-red-700">Tránh phối</p>
                </div>
                <div className="flex flex-col gap-1">
                  {profile.disliked_combos.slice(0, 3).map((c) => (
                    <p key={c} className="text-xs text-zinc-600">• {c}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top colors & styles */}
          <div className="grid grid-cols-2 gap-3">
            {profile.top_colors?.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-semibold text-zinc-600 mb-2">🎨 Màu hay dùng</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.top_colors.map((c) => (
                    <span key={c} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.top_occasions?.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-semibold text-zinc-600 mb-2">📅 Dịp hay mặc</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.top_occasions.map((o) => (
                    <span key={o} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-400">
            Cập nhật lần cuối:{" "}
            {profile.last_updated
              ? new Date(profile.last_updated).toLocaleDateString("vi-VN")
              : "Chưa có"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-12">
          <div className="rounded-full bg-zinc-100 p-5">
            <Brain size={28} className="text-zinc-300" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-zinc-500">AI chưa có dữ liệu</p>
            <p className="text-sm text-zinc-400 mt-1">
              Rate các outfit AI gợi ý → nhấn &quot;Train AI&quot; để AI học phong cách của bạn
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
