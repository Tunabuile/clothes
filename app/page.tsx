"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, Plus, Shirt, Sparkles, ImagePlus, Recycle, Palette, Trash2, Globe } from "lucide-react";
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
import { useI18n, type Lang } from "@/lib/i18n";

type Tab = "tryon" | "closet" | "studio" | "recycle";

const TAB_ICONS: Record<Tab, any> = {
  studio: Palette,
  tryon: Wand2,
  closet: Shirt,
  recycle: Recycle,
};

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  const [personBase64, setPersonBase64] = useState("");
  const [personPreview, setPersonPreview] = useState("");
  const [clothImages, setClothImages] = useState<UploadedImage[]>([]);
  const [selectedClothId, setSelectedClothId] = useState<string | null>(null);
  const [clothBase64, setClothBase64] = useState("");
  const [clothPreview, setClothPreview] = useState("");
  const [clothMime, setClothMime] = useState("image/jpeg");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [gender, setGender] = useState(lang === "vi" ? "Nam" : "Male");
  const [resultText, setResultText] = useState("");
  const [personDesc, setPersonDesc] = useState("");
  const [clothDesc, setClothDesc] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState("");
  const [userRequest, setUserRequest] = useState("");
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClothImagesChange = (imgs: UploadedImage[]) => setClothImages(imgs);

  useEffect(() => {
    if (clothImages.length === 0) {
      setSelectedClothId(null); setClothBase64(""); setClothPreview(""); setClothMime("image/jpeg");
      return;
    }
    const stillSelected = selectedClothId && clothImages.some((img) => img.id === selectedClothId);
    const id = stillSelected ? selectedClothId : clothImages[0].id;
    if (!stillSelected) setSelectedClothId(id);
    const img = clothImages.find((i) => i.id === id) ?? clothImages[0];
    setClothBase64(img.base64); setClothPreview(img.previewUrl); setClothMime(img.mimeType);
  }, [clothImages, selectedClothId]);

  const handleAddToCloset = useCallback(async () => {
    const targets = clothImages.length > 0 ? clothImages : clothBase64 ? [{ id: crypto.randomUUID(), base64: clothBase64, mimeType: clothMime, previewUrl: clothPreview }] : [];
    if (targets.length === 0) return;
    setIsAnalyzing(true); setError("");
    try {
      for (const img of targets) {
        const res = await fetch("/api/analyze-clothing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }) });
        const data = await res.json();
        setCloset((prev) => [{
          id: crypto.randomUUID(), imageUrl: img.previewUrl, imageBase64: img.base64,
          type: data.data?.type || "Unknown", color: data.data?.color || "Unknown",
          material: data.data?.material || "Unknown", style: data.data?.style || "Casual",
          condition: data.data?.condition || "Good", addedAt: new Date(), tryOnCount: 0,
        }, ...prev]);
      }
      setActiveTab("closet");
    } catch { setError("Cannot analyze image."); }
    finally { setIsAnalyzing(false); }
  }, [clothImages, clothBase64, clothMime, clothPreview]);

  const handleTryOn = useCallback(async (clothItem?: ClothingItem) => {
    const selectedImage = clothImages.find((img) => img.id === selectedClothId);
    const targetBase64 = clothItem?.imageBase64 ?? selectedImage?.base64 ?? clothBase64;
    if (!targetBase64) { setError(t("tryon.error")); return; }
    setIsProcessing(true); setResultText(""); setGeneratedImageUrl(""); setError("");
    try {
      const res = await fetch("/api/describe-outfit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personImageBase64: personBase64 || "", clothImageBase64: targetBase64, height, weight, gender, userRequest }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultText(data.resultText || "No result."); setPersonDesc(data.personDesc || ""); setClothDesc(data.clothDesc || "");
      if (clothItem) setCloset((prev) => prev.map((c) => c.id === clothItem.id ? { ...c, tryOnCount: c.tryOnCount + 1, lastTriedAt: new Date() } : c));
    } catch (err) { setError(err instanceof Error ? err.message : "Connection error."); }
    finally { setIsProcessing(false); }
  }, [personBase64, clothBase64, clothImages, selectedClothId, clothMime, height, weight, userRequest, t]);

  const handleDeleteFromCloset = (id: string) => setCloset((prev) => prev.filter((c) => c.id !== id));
  const handleGenerateIllustration = useCallback(async () => {
    if (!resultText) return; setIsGeneratingImage(true); setError("");
    try {
      const res = await fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: resultText, style: "realistic", personDesc, clothDesc, gender }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image error");
      setGeneratedImageUrl(`data:${data.mimeType};base64,${data.imageBase64}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Cannot generate image."); }
    finally { setIsGeneratingImage(false); }
  }, [resultText, userRequest, personDesc, clothDesc]);
  const handleClearCloset = () => { if (confirm(t("closet.confirm"))) setCloset([]); };

  const genderOptions = lang === "vi" ? [{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }] : [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }];

  return (
    <div className="min-h-screen">
      {showGenerateModal && (
        <GenerateImageModal
          onClose={() => setShowGenerateModal(false)}
          onUseImage={(b64, mime, preview) => {
            handleClothImagesChange([...clothImages, { id: crypto.randomUUID(), base64: b64, mimeType: mime, previewUrl: preview, name: "AI Generated" }]);
          }}
        />
      )}

      {/* Professional Header */}
      <header className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        isScrolled ? "glass-strong shadow-sm" : "bg-transparent"
      )}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-2 shadow-lg shadow-violet-200">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 tracking-tight">FitAI</h1>
              <p className="text-[11px] text-zinc-400 -mt-0.5">{t("app.subtitle")}</p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-100/80 backdrop-blur-sm p-1 rounded-2xl border border-zinc-200/50">
            {(["studio", "tryon", "closet", "recycle"] as Tab[]).map((tab) => {
              const Icon = TAB_ICONS[tab];
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    activeTab === tab
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  <Icon size={15} />
                  <span>{t(`tab.${tab}`)}</span>
                  {tab === "closet" && closet.length > 0 && (
                    <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {closet.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8">
        {/* STUDIO */}
        {activeTab === "studio" && (
          <div className="animate-fade-in">
            <DreaminaStudio />
          </div>
        )}

        {/* TRY-ON */}
        {activeTab === "tryon" && (
          <div className="animate-fade-in grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-1">
              <div className="card p-4 sm:p-5">
                <ImageUploader label={t("tryon.person.label")} hint={t("tryon.person.hint")}
                  previewUrl={personPreview}
                  onImageChange={(b64, _, preview) => { setPersonBase64(b64); setPersonPreview(preview); }} />
              </div>
              <BodyForm height={height} weight={weight}
                onChange={(field, val) => { if (field === "height") setHeight(val); else setWeight(val); }} />
              <div className="card p-4 sm:p-5">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">{t("tryon.gender")}</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="input-modern">
                  {genderOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-1">
              <div className="card p-4 sm:p-5">
                <MultiImageUploader label={t("tryon.cloth.label")} hint={t("tryon.cloth.hint")}
                  images={clothImages} onChange={handleClothImagesChange} maxImages={10} />

                {clothImages.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-semibold text-zinc-700">{t("tryon.cloth.select")}</p>
                    <p className="mb-2 text-xs text-zinc-400">{t("tryon.cloth.select.hint")} <span className="font-semibold text-violet-600">purple border</span></p>
                    <div className="grid grid-cols-4 gap-2">
                      {clothImages.map((img) => (
                        <button key={img.id} type="button" title={img.name || "Clothing"}
                          onClick={() => setSelectedClothId(img.id)}
                          className={cn("relative overflow-hidden rounded-xl border-2 bg-zinc-50 transition-all aspect-square",
                            selectedClothId === img.id ? "border-violet-500 ring-2 ring-violet-200" : "border-zinc-200 hover:border-violet-300"
                          )}>
                          <img src={img.previewUrl} alt={img.name || "Clothing"} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-4 sm:p-5">
                <label className="text-sm font-semibold text-zinc-700">{t("tryon.request")}</label>
                <textarea value={userRequest} onChange={(e) => setUserRequest(e.target.value)}
                  placeholder={t("tryon.request.placeholder")}
                  className="input-modern mt-2 min-h-[80px] resize-none" />
              </div>

              <button onClick={() => setShowGenerateModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 py-3 text-sm font-medium text-violet-600 hover:bg-violet-100 transition-all">
                <ImagePlus size={16} /> {t("tryon.generate")}
              </button>

              <div className="flex flex-col gap-2">
                <button onClick={() => handleTryOn()} disabled={!clothBase64 || isProcessing}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                  <Wand2 size={16} />
                  {isProcessing ? t("tryon.button.loading") : t("tryon.button")}
                </button>
                <button onClick={handleAddToCloset} disabled={clothImages.length === 0 && !clothBase64 || isAnalyzing}
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-40">
                  <Plus size={15} />
                  {isAnalyzing ? t("tryon.saving") : clothImages.length > 1 ? t("tryon.save.multi", { count: clothImages.length }) : t("tryon.save")}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <span>⚠️ {error}</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="card p-4 sm:p-5">
                <TryOnResult resultText={resultText} generatedImageUrl={generatedImageUrl}
                  isLoading={isProcessing} isGeneratingImage={isGeneratingImage}
                  onGenerateImage={handleGenerateIllustration} />
              </div>
            </div>
          </div>
        )}

        {/* CLOSET */}
        {activeTab === "closet" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{t("closet.title")}</h2>
                <p className="text-sm text-zinc-400 mt-0.5">{closet.length} {t("closet.count")}</p>
              </div>
              <div className="flex gap-2">
                {closet.length > 0 && (
                  <button onClick={handleClearCloset}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 size={14} /> {t("closet.clear")}
                  </button>
                )}
                <button onClick={() => setActiveTab("tryon")}
                  className="btn-primary flex items-center gap-1.5">
                  <Plus size={14} /> {t("closet.add")}
                </button>
              </div>
            </div>

            {closet.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-white/50 py-20">
                <div className="rounded-full bg-zinc-100 p-6"><Shirt size={40} className="text-zinc-300" /></div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-500">{t("closet.empty")}</p>
                  <p className="text-sm text-zinc-400 mt-1">{t("closet.empty.hint")}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {closet.map((item) => (
                  <ClothingCard key={item.id} item={item}
                    onTryOn={(item) => { setActiveTab("tryon"); handleTryOn(item); }}
                    onDelete={handleDeleteFromCloset} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECYCLE */}
        {activeTab === "recycle" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-900">{t("recycle.title")}</h2>
              <p className="text-sm text-zinc-400 mt-0.5">{t("recycle.subtitle")}</p>
            </div>
            <RecycleHub />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-40 w-full glass-strong border-t border-zinc-200/80 sm:hidden pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          {(["studio", "tryon", "closet", "recycle"] as Tab[]).map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all",
                  activeTab === tab ? "text-violet-700 bg-violet-50" : "text-zinc-400"
                )}>
                <Icon size={20} />
                <span className="text-[9px] font-medium">{t(`tab.${tab}`)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Language Switcher */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full border border-zinc-200 shadow-lg p-1">
          <Globe size={15} className="text-zinc-400 ml-2" />
          {(["vi", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
                lang === l ? "bg-violet-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}>
              {l === "vi" ? "VI" : "EN"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}