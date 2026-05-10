"use client";

import { useState, useCallback } from "react";
import { Wand2, Plus, Shirt, Sparkles, ImagePlus, Brain, User, Zap, Bot, Recycle } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import MultiImageUploader, { UploadedImage } from "@/components/MultiImageUploader";
import BodyForm from "@/components/BodyForm";
import ClothingCard from "@/components/ClothingCard";
import TryOnResult from "@/components/TryOnResult";
import GenerateImageModal from "@/components/GenerateImageModal";
import OutfitSuggestion from "@/components/OutfitSuggestion";
import AIStyleProfile from "@/components/AIStyleProfile";
import CLIPMatcher from "@/components/CLIPMatcher";
import AutoLearning from "@/components/AutoLearning";
import LabelScanner from "@/components/LabelScanner";
import RecycleHub from "@/components/RecycleHub";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "tryon" | "closet" | "stylist" | "profile" | "clip" | "auto" | "recycle";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tryon");

  // Ảnh người dùng
  const [personBase64, setPersonBase64] = useState("");
  const [personPreview, setPersonPreview] = useState("");

  // Multi ảnh quần áo
  const [clothImages, setClothImages] = useState<UploadedImage[]>([]);
  const [selectedClothId, setSelectedClothId] = useState<string | null>(null);

  // Ảnh quần áo đang chọn để thử (lấy từ clothImages[0] hoặc generated)
  const [clothBase64, setClothBase64] = useState("");
  const [clothPreview, setClothPreview] = useState("");
  const [clothMime, setClothMime] = useState("image/jpeg");

  // Sync clothImages[0] → clothBase64 (cho try-on)
  const handleClothImagesChange = (imgs: UploadedImage[]) => {
    setClothImages(imgs);
    const first = imgs[0] || null;
    setSelectedClothId(first?.id || null);

    if (first) {
      setClothBase64(first.base64);
      setClothPreview(first.previewUrl);
      setClothMime(first.mimeType);
    } else {
      setClothBase64("");
      setClothPreview("");
      setClothMime("image/jpeg");
    }
  };

  // Thông số cơ thể
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);

  // Kết quả try-on
  const [resultText, setResultText] = useState("");
  const [personDesc, setPersonDesc] = useState("");
  const [clothDesc, setClothDesc] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState("");
  const [userRequest, setUserRequest] = useState("");

  // Tủ đồ (lưu local state, sau này kết nối Supabase)
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal tạo ảnh AI
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Thêm đồ vào tủ (có Gemini phân tích) — lưu tất cả ảnh đã upload
  const handleAddToCloset = useCallback(async () => {
    const targets = clothImages.length > 0
      ? clothImages
      : clothBase64 ? [{ id: crypto.randomUUID(), base64: clothBase64, mimeType: clothMime, previewUrl: clothPreview }]
      : [];

    if (targets.length === 0) return;
    setIsAnalyzing(true);
    setError("");

    try {
      for (const img of targets) {
        const res = await fetch("/api/analyze-clothing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }),
        });
        const data = await res.json();

        const newItem: ClothingItem = {
          id: crypto.randomUUID(),
          imageUrl: img.previewUrl,
          imageBase64: img.base64,
          type: data.data?.type || "Unknown",
          color: data.data?.color || "Unknown",
          material: data.data?.material || "Unknown",
          style: data.data?.style || "Casual",
          condition: data.data?.condition || "Good",
          addedAt: new Date(),
          tryOnCount: 0,
        };
        setCloset((prev) => [newItem, ...prev]);
      }
      setActiveTab("closet");
    } catch {
      setError("Không thể phân tích ảnh. Kiểm tra GEMINI_API_KEY.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [clothImages, clothBase64, clothMime, clothPreview]);

  // Virtual Try-On
  const handleTryOn = useCallback(
    async (clothItem?: ClothingItem) => {
      const selectedImage = clothImages.find((img) => img.id === selectedClothId);
      const targetBase64 = clothItem?.imageBase64 || clothBase64 || selectedImage?.base64;
      const targetMime = clothItem?.imageBase64 ? clothMime : selectedImage?.mimeType || clothMime;
      if (!targetBase64) {
        setError("Cần ảnh quần áo!");
        return;
      }

      setIsProcessing(true);
      setResultText("");
      setGeneratedImageUrl("");
      setError("");

      try {
        const res = await fetch("/api/describe-outfit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personImageBase64: personBase64 || "",
            clothImageBase64: targetBase64,
            height,
            weight,
            userRequest,
          }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setResultText(data.resultText || "AI chưa trả về kết quả.");
        setPersonDesc(data.personDesc || "");
        setClothDesc(data.clothDesc || "");

        // Cập nhật tryOnCount nếu từ tủ đồ
        if (clothItem) {
          setCloset((prev) =>
            prev.map((c) =>
              c.id === clothItem.id
                ? { ...c, tryOnCount: c.tryOnCount + 1, lastTriedAt: new Date() }
                : c
            )
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Lỗi kết nối AI. Thử lại nhé!"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [personBase64, clothBase64, clothImages, selectedClothId, clothMime, height, weight, userRequest]
  );

  const handleDeleteFromCloset = (id: string) => {
    setCloset((prev) => prev.filter((c) => c.id !== id));
  };

  const handleGenerateIllustration = useCallback(async () => {
    if (!resultText) return;
    setIsGeneratingImage(true);
    setError("");

    try {
      const prompt = `${resultText} ${userRequest ? `Yêu cầu người dùng: ${userRequest}` : ""}`;
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: "realistic", aspectRatio: "1:1", personDesc, clothDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo ảnh");
      setGeneratedImageUrl(`data:${data.mimeType};base64,${data.imageBase64}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được ảnh.");
    } finally {
      setIsGeneratingImage(false);
    }
  }, [resultText, userRequest, personDesc, clothDesc]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Modal tạo ảnh AI */}
      {showGenerateModal && (
        <GenerateImageModal
          onClose={() => setShowGenerateModal(false)}
          onUseImage={(b64, mime, preview) => {
            const newImg: UploadedImage = {
              id: crypto.randomUUID(),
              base64: b64,
              mimeType: mime,
              previewUrl: preview,
              name: "AI Generated",
            };
            handleClothImagesChange([...clothImages, newImg]);
          }}
        />
      )}
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-violet-600 p-2">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900">FitAI</h1>
              <p className="text-xs text-zinc-400">Virtual Try-On</p>
            </div>
          </div>

          {/* Tabs (Chỉ hiện trên màn hình lớn) */}
          <div className="hidden sm:block w-full overflow-x-auto">
            <div className="flex w-max sm:w-auto sm:justify-end rounded-xl sm:rounded-none sm:border-0 sm:bg-transparent border border-zinc-200 bg-zinc-50 p-1 sm:p-0 gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("tryon")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "tryon"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Wand2 size={14} />
              Phối đồ thông minh
            </button>
            <button
              onClick={() => setActiveTab("closet")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "closet"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Shirt size={14} />
              Tủ đồ
              {closet.length > 0 && (
                <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-xs text-white">
                  {closet.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("stylist")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "stylist"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Brain size={14} />
              Phối đồ AI
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "profile"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <User size={14} />
              Style AI
            </button>
            <button
              onClick={() => setActiveTab("clip")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "clip"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Zap size={14} />
              CLIP
            </button>
            <button
              onClick={() => setActiveTab("auto")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "auto"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Bot size={14} />
              Auto AI
            </button>
            <button
              onClick={() => setActiveTab("recycle")}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === "recycle"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Recycle size={14} />
              Tái chế
            </button>
          </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {/* ===== TAB: PHỐI ĐỒ THÔNG MINH ===== */}
        {activeTab === "tryon" && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Cột trái: Upload + Body */}
            <div className="flex flex-col gap-4 sm:gap-5 lg:col-span-1">
              <ImageUploader
                label="📸 Ảnh của bạn (tuỳ chọn)"
                hint="Nếu có ảnh, AI tư vấn vừa vặn & dáng người tốt hơn"
                previewUrl={personPreview}
                onImageChange={(b64, _, preview) => {
                  setPersonBase64(b64);
                  setPersonPreview(preview);
                }}
              />

              <BodyForm
                height={height}
                weight={weight}
                onChange={(field, val) => {
                  if (field === "height") setHeight(val);
                  else setWeight(val);
                }}
              />
            </div>

            {/* Cột giữa: Ảnh đồ + nút */}
            <div className="flex flex-col gap-4 sm:gap-5 lg:col-span-1">
              <div className="flex flex-col gap-2">
                <MultiImageUploader
                  label="👕 Ảnh quần áo"
                  hint="Upload nhiều món cùng lúc — chọn ảnh để thử và lưu vào tủ đồ"
                  images={clothImages}
                  onChange={handleClothImagesChange}
                  maxImages={10}
                />

                {clothImages.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="mb-2 text-sm font-semibold text-zinc-700">
                      Chọn món quần áo để AI nhận diện và thử
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {clothImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => {
                            setSelectedClothId(img.id);
                            setClothBase64(img.base64);
                            setClothPreview(img.previewUrl);
                            setClothMime(img.mimeType);
                          }}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border bg-zinc-50 transition",
                            selectedClothId === img.id
                              ? "border-violet-500 ring-2 ring-violet-200"
                              : "border-zinc-200 hover:border-violet-300"
                          )}
                        >
                          <img
                            src={img.previewUrl}
                            alt={img.name || "cloth"}
                            className="h-20 w-full object-contain"
                          />
                          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                            {img.name ? img.name.replace(/\..+$/, "") : "Món"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <label className="text-sm font-semibold text-zinc-700">
                    Yêu cầu AI
                  </label>
                  <textarea
                    value={userRequest}
                    onChange={(e) => setUserRequest(e.target.value)}
                    placeholder="Nhập yêu cầu phong cách, dịp, màu sắc..."
                    className="mt-3 min-h-[96px] w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 outline-none transition focus:border-violet-400"
                  />
                </div>

                {/* Nút tạo ảnh AI */}
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-100 transition"
                >
                  <ImagePlus size={15} />
                  ✨ Tạo ảnh đồ bằng AI
                </button>
              </div>

              {/* Nút actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleTryOn()}
                  disabled={!clothBase64 || isProcessing}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Wand2 size={16} />
                  {isProcessing ? "AI đang xử lý..." : "✨ Phối đồ thông minh"}
                </button>

                <button
                  onClick={handleAddToCloset}
                  disabled={clothImages.length === 0 && !clothBase64 || isAnalyzing}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Plus size={15} />
                  {isAnalyzing
                    ? "Đang phân tích..."
                    : clothImages.length > 1
                    ? `Lưu ${clothImages.length} món vào tủ đồ`
                    : "Lưu vào tủ đồ"}
                </button>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Cột phải: Kết quả */}
            <div className="lg:col-span-1">
              <p className="mb-2 text-sm font-semibold text-zinc-700">
                🎨 Kết quả
              </p>
              <TryOnResult
                resultText={resultText}
                generatedImageUrl={generatedImageUrl}
                isLoading={isProcessing}
                isGeneratingImage={isGeneratingImage}
                onGenerateImage={handleGenerateIllustration}
              />
            </div>
          </div>
        )}

        {/* ===== TAB: TỦ ĐỒ ===== */}
        {activeTab === "closet" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  👗 Tủ đồ của bạn
                </h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {closet.length} món đồ •{" "}
                  {closet.filter(
                    (c) =>
                      Math.floor(
                        (Date.now() - new Date(c.addedAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) > 90 && c.tryOnCount === 0
                  ).length}{" "}
                  món bốc bụi
                </p>
              </div>
              <button
                onClick={() => setActiveTab("tryon")}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
              >
                <Plus size={14} />
                Thêm đồ
              </button>
            </div>

            {closet.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-200 py-20">
                <div className="rounded-full bg-zinc-100 p-6">
                  <Shirt size={40} className="text-zinc-300" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-500">Tủ đồ trống</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Upload ảnh quần áo và nhấn &quot;Lưu vào tủ đồ&quot; để bắt đầu
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {closet.map((item) => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    onTryOn={(item) => {
                      setActiveTab("tryon");
                      handleTryOn(item);
                    }}
                    onDelete={handleDeleteFromCloset}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* ===== TAB: PHỐI ĐỒ AI ===== */}
        {activeTab === "stylist" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">🧠 AI Stylist</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                AI nhìn vào tủ đồ của bạn và tư duy phối outfit phù hợp
              </p>
            </div>
            <OutfitSuggestion
              closet={closet}
              onTryOutfit={(items) => {
                // Lấy món đầu tiên để thử đồ, chuyển sang tab tryon
                if (items[0]) {
                  setClothBase64(items[0].imageBase64 || "");
                  setClothPreview(items[0].imageUrl);
                  setClothMime("image/jpeg");
                  setActiveTab("tryon");
                }
              }}
            />
          </div>
        )}
        {/* ===== TAB: TÁI CHẾ ===== */}
        {activeTab === "recycle" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">♻️ Tái Chế & Upcycle</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Browse ý tưởng tái chế hoặc chụp sản phẩm để AI gợi ý riêng cho bạn
              </p>
            </div>
            <RecycleHub />
          </div>
        )}

        {/* ===== TAB: AUTO LEARNING ===== */}
        {activeTab === "auto" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">🤖 AI Tự Động Học</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                AI tự crawl ảnh, tự phân tích, tự học xu hướng — không cần user làm gì
              </p>
            </div>
            <AutoLearning />
          </div>
        )}

        {/* ===== TAB: CLIP MATCHER ===== */}
        {activeTab === "clip" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">⚡ CLIP Visual Matcher</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                AI nhìn ảnh thật → tính độ tương thích → chọn combo đẹp nhất
              </p>
            </div>
            <CLIPMatcher
              closet={closet}
              onTryOutfit={(items) => {
                if (items[0]) {
                  setClothBase64(items[0].imageBase64 || "");
                  setClothPreview(items[0].imageUrl);
                  setClothMime("image/jpeg");
                  setActiveTab("tryon");
                }
              }}
            />
          </div>
        )}

        {/* ===== TAB: AI STYLE PROFILE ===== */}
        {activeTab === "profile" && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">🧠 AI Style Profile</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                AI học từ feedback của bạn và tự cải thiện theo thời gian
              </p>
            </div>
            <AIStyleProfile />
          </div>
        )}
      </main>

      {/* ===== BOTTOM NAVIGATION (Chỉ hiện trên Mobile) ===== */}
      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-200 bg-white/90 backdrop-blur-md sm:hidden pb-safe">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab("tryon")}
            className={`flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "tryon" ? "bg-violet-50 text-violet-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Wand2 size={20} />
            <span className="text-[10px] font-medium">Phối đồ</span>
          </button>
          
          <button
            onClick={() => setActiveTab("closet")}
            className={`relative flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "closet" ? "bg-violet-50 text-violet-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Shirt size={20} />
            <span className="text-[10px] font-medium">Tủ đồ</span>
            {closet.length > 0 && (
              <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("stylist")}
            className={`flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "stylist" ? "bg-violet-50 text-violet-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Brain size={20} />
            <span className="text-[10px] font-medium">AI Stylist</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "profile" ? "bg-violet-50 text-violet-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Profile AI</span>
          </button>

          <button
            onClick={() => setActiveTab("clip")}
            className={`flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "clip" ? "bg-blue-50 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Zap size={20} />
            <span className="text-[10px] font-medium">CLIP</span>
          </button>

          <button
            onClick={() => setActiveTab("auto")}
            className={`flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "auto" ? "bg-green-50 text-green-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Bot size={20} />
            <span className="text-[10px] font-medium">Auto AI</span>
          </button>

          <button
            onClick={() => setActiveTab("recycle")}
            className={`flex flex-col items-center justify-center min-w-[70px] shrink-0 gap-1 rounded-xl p-2 transition-colors ${
              activeTab === "recycle" ? "bg-green-50 text-green-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Recycle size={20} />
            <span className="text-[10px] font-medium">Tái chế</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
