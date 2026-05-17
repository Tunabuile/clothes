"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, Plus, Shirt, Sparkles, ImagePlus, Recycle, Palette, Trash2, RotateCcw } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import MultiImageUploader, { UploadedImage } from "@/components/MultiImageUploader";
import BodyForm from "@/components/BodyForm";
import ClothingCard from "@/components/ClothingCard";
import TryOnResult from "@/components/TryOnResult";
import GenerateImageModal from "@/components/GenerateImageModal";
import RecycleHub from "@/components/RecycleHub";
import DreaminaStudio from "@/components/DreaminaStudio";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "tryon" | "closet" | "studio" | "recycle";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("studio");

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

  const handleClothImagesChange = (imgs: UploadedImage[]) => {
    setClothImages(imgs);
  };

  // Giữ đúng món đang chọn (viền tím) khi thêm/xóa ảnh
  useEffect(() => {
    if (clothImages.length === 0) {
      setSelectedClothId(null);
      setClothBase64("");
      setClothPreview("");
      setClothMime("image/jpeg");
      return;
    }
    const stillSelected =
      selectedClothId &&
      clothImages.some((img) => img.id === selectedClothId);
    const id = stillSelected ? selectedClothId : clothImages[0].id;
    if (!stillSelected) {
      setSelectedClothId(id);
    }
    const img = clothImages.find((i) => i.id === id) ?? clothImages[0];
    setClothBase64(img.base64);
    setClothPreview(img.previewUrl);
    setClothMime(img.mimeType);
  }, [clothImages, selectedClothId]);

  // Thông số cơ thể
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [gender, setGender] = useState("Nam");

  // Kết quả try-on
  const [resultText, setResultText] = useState("");
  const [personDesc, setPersonDesc] = useState("");
  const [clothDesc, setClothDesc] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState("");
  const [userRequest, setUserRequest] = useState("");

  // Tủ đồ
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Modal tạo ảnh AI
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Thêm đồ vào tủ
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
      setError("Không thể phân tích ảnh.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [clothImages, clothBase64, clothMime, clothPreview]);

  // Virtual Try-On
  const handleTryOn = useCallback(
    async (clothItem?: ClothingItem) => {
      const selectedImage = clothImages.find((img) => img.id === selectedClothId);
      const targetBase64 =
        clothItem?.imageBase64 ??
        selectedImage?.base64 ??
        clothBase64;
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
            gender,
            userRequest,
          }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        setResultText(data.resultText || "AI chưa trả về kết quả.");
        setPersonDesc(data.personDesc || "");
        setClothDesc(data.clothDesc || "");

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
        body: JSON.stringify({ prompt, style: "realistic", aspectRatio: "1:1", personDesc, clothDesc, gender }),
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

  const handleClearCloset = () => {
    if (confirm("Xóa tất cả đồ trong tủ?")) {
      setCloset([]);
    }
  };

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

          {/* Tabs */}
          <div className="hidden sm:block">
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab("studio")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition sm:text-sm ${
                  activeTab === "studio"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Palette size={14} />
                Studio
              </button>
              <button
                onClick={() => setActiveTab("tryon")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition sm:text-sm ${
                  activeTab === "tryon"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Wand2 size={14} />
                Phối đồ
              </button>
              <button
                onClick={() => setActiveTab("closet")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition sm:text-sm ${
                  activeTab === "closet"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Shirt size={14} />
                Tủ đồ
                {closet.length > 0 && (
                  <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">
                    {closet.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("recycle")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition sm:text-sm ${
                  activeTab === "recycle"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
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
        {/* ===== TAB: STUDIO ===== */}
        {activeTab === "studio" && <DreaminaStudio />}

        {/* ===== TAB: PHỐI ĐỒ ===== */}
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
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
                    <p className="mb-2 text-xs text-zinc-500">
                      AI chỉ xử lý ảnh có <span className="font-semibold text-violet-600">viền tím</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {clothImages.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          title={img.name || "Quần áo"}
                          onClick={() => setSelectedClothId(img.id)}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border bg-zinc-50 transition",
                            selectedClothId === img.id
                              ? "border-violet-500 ring-2 ring-violet-200"
                              : "border-zinc-200 hover:border-violet-300"
                          )}
                        >
                          <img
                            src={img.previewUrl}
                            alt={img.name || "Quần áo"}
                            className="h-20 w-full object-contain"
                          />
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

                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-100 transition"
                >
                  <ImagePlus size={15} />
                  ✨ Tạo ảnh đồ bằng AI
                </button>
              </div>

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
                  {closet.length} món đồ
                </p>
              </div>
              <div className="flex gap-2">
                {closet.length > 0 && (
                  <button
                    onClick={handleClearCloset}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={14} />
                    Xóa tất cả
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("tryon")}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
                >
                  <Plus size={14} />
                  Thêm đồ
                </button>
              </div>
            </div>

            {closet.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-200 py-20">
                <div className="rounded-full bg-zinc-100 p-6">
                  <Shirt size={40} className="text-zinc-300" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-500">Tủ đồ trống</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Upload ảnh quần áo và nhấn "Lưu vào tủ đồ" để bắt đầu
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
      </main>

      {/* ===== BOTTOM NAV (Mobile) ===== */}
      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-200 bg-white/90 backdrop-blur-md sm:hidden pb-safe">
        <div className="flex items-center justify-around px-3 py-2">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              activeTab === "studio" ? "text-violet-700" : "text-zinc-500"
            }`}
          >
            <Palette size={22} />
            <span className="text-[10px] font-medium">Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("tryon")}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              activeTab === "tryon" ? "text-violet-700" : "text-zinc-500"
            }`}
          >
            <Wand2 size={22} />
            <span className="text-[10px] font-medium">Phối đồ</span>
          </button>
          <button
            onClick={() => setActiveTab("closet")}
            className={`relative flex flex-col items-center gap-0.5 p-2 transition-colors ${
              activeTab === "closet" ? "text-violet-700" : "text-zinc-500"
            }`}
          >
            <Shirt size={22} />
            <span className="text-[10px] font-medium">Tủ đồ</span>
            {closet.length > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("recycle")}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              activeTab === "recycle" ? "text-violet-700" : "text-zinc-500"
            }`}
          >
            <Recycle size={22} />
            <span className="text-[10px] font-medium">Tái chế</span>
          </button>
        </div>
      </nav>
    </div>
  );
}