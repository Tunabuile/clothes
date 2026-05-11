"use client";

import { useState } from "react";
import { Bot, Download, Sparkles, TrendingUp, Loader2 } from "lucide-react";

export default function AutoLearning() {
  const [isLearning, setIsLearning] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  const handleInitKnowledge = async () => {
    setIsLearning(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/auto-learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init-knowledge" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setIsLearning(false);
    }
  };

  const handleCrawlAndLearn = async () => {
    setIsLearning(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/auto-learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crawl-and-learn", count: 20 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(
        `Crawled ${data.crawled} ảnh, học được ${data.learned} insights. VD: "${data.insights[0] || ""}"`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setIsLearning(false);
    }
  };

  const handleAutoFillCloset = async () => {
    setIsFilling(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/auto-learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto-fill-closet", count: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Đã thêm ${data.added} món đồ: ${data.items.join(", ")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="rounded-xl bg-green-600 p-2">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">AI Tự Động Học</h3>
            <p className="text-xs text-zinc-400">
              AI tự crawl ảnh, tự phân tích, tự học xu hướng — không cần user làm gì
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Init knowledge */}
          <button
            onClick={handleInitKnowledge}
            disabled={isLearning}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
          >
            {isLearning ? (
              <><Loader2 size={15} className="animate-spin" /> Đang khởi tạo...</>
            ) : (
              <><Sparkles size={15} /> Khởi tạo Fashion Knowledge</>
            )}
          </button>

          {/* Crawl and learn */}
          <button
            onClick={handleCrawlAndLearn}
            disabled={isLearning}
            className="flex items-center justify-center gap-2 rounded-xl border border-green-600 bg-white py-3 text-sm font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50 transition"
          >
            {isLearning ? (
              <><Loader2 size={15} className="animate-spin" /> Đang crawl...</>
            ) : (
              <><TrendingUp size={15} /> Crawl & Học từ Internet (20 ảnh)</>
            )}
          </button>

          {/* Auto-fill closet */}
          <button
            onClick={handleAutoFillCloset}
            disabled={isFilling}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
          >
            {isFilling ? (
              <><Loader2 size={15} className="animate-spin" /> Đang điền tủ...</>
            ) : (
              <><Download size={15} /> Tự động điền tủ đồ (10 món)</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✅ {result}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold text-zinc-600 mb-2">🤖 Cách hoạt động:</p>
        <ul className="text-xs text-zinc-500 space-y-1">
          <li>• <strong>Khởi tạo Knowledge:</strong> Load fashion trends 2025, quy tắc phối đồ</li>
          <li>• <strong>Crawl & Học:</strong> Tìm ảnh fashion trên Unsplash → AI phân tích → học insights</li>
          <li>• <strong>Tự động điền tủ:</strong> Crawl ảnh đồ → phân tích → lưu vào tủ của bạn</li>
        </ul>
        <p className="text-xs text-amber-600 mt-3">
          ⚠️ Cần API keys: UNSPLASH_ACCESS_KEY hoặc PEXELS_API_KEY trong .env
        </p>
      </div>
    </div>
  );
}
