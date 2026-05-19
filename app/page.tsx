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

const TAB_ICONS: Record<Tab, any> = { studio: Palette, tryon: Wand2, closet: Shirt, recycle: Recycle };

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

  const handleClothImagesChange = (imgs: UploadedImage[]) => setClothImages(imgs);

  useEffect(() => {
    if (clothImages.length === 0) { setSelectedClothId(null); setClothBase64(""); setClothPreview(""); setClothMime("image/jpeg"); return; }
    const ss = selectedClothId && clothImages.some(i => i.id === selectedClothId);
    const id = ss ? selectedClothId : clothImages[0].id;
    if (!ss) setSelectedClothId(id);
    const img = clothImages.find(i => i.id === id) ?? clothImages[0];
    setClothBase64(img.base64); setClothPreview(img.previewUrl); setClothMime(img.mimeType);
  }, [clothImages, selectedClothId]);

  const handleAddToCloset = useCallback(async () => {
    const targets = clothImages.length > 0 ? clothImages : clothBase64 ? [{ id: crypto.randomUUID(), base64: clothBase64, mimeType: clothMime, previewUrl: clothPreview }] : [];
    if (!targets.length) return;
    setIsAnalyzing(true); setError("");
    try {
      for (const img of targets) {
        const r = await fetch("/api/analyze-clothing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }) });
        const d = await r.json();
        setCloset(p => [{ id: crypto.randomUUID(), imageUrl: img.previewUrl, imageBase64: img.base64, type: d.data?.type || "Unknown", color: d.data?.color || "Unknown", material: d.data?.material || "Unknown", style: d.data?.style || "Casual", condition: d.data?.condition || "Good", addedAt: new Date(), tryOnCount: 0 }, ...p]);
      }
      setActiveTab("closet");
    } catch { setError("Cannot analyze image."); }
    finally { setIsAnalyzing(false); }
  }, [clothImages, clothBase64, clothMime, clothPreview]);

  const handleTryOn = useCallback(async (clothItem?: ClothingItem) => {
    const si = clothImages.find(i => i.id === selectedClothId);
    const tb = clothItem?.imageBase64 ?? si?.base64 ?? clothBase64;
    if (!tb) { setError("Need clothing image!"); return; }
    setIsProcessing(true); setResultText(""); setGeneratedImageUrl(""); setError("");
    try {
      const r = await fetch("/api/describe-outfit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personImageBase64: personBase64 || "", clothImageBase64: tb, height, weight, gender, userRequest }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResultText(d.resultText || ""); setPersonDesc(d.personDesc || ""); setClothDesc(d.clothDesc || "");
      if (clothItem) setCloset(p => p.map(c => c.id === clothItem.id ? { ...c, tryOnCount: c.tryOnCount + 1, lastTriedAt: new Date() } : c));
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setIsProcessing(false); }
  }, [personBase64, clothBase64, clothImages, selectedClothId, clothMime, height, weight, userRequest]);

  const handleDeleteFromCloset = (id: string) => setCloset(p => p.filter(c => c.id !== id));
  const handleGenerateIllustration = useCallback(async () => {
    if (!resultText) return; setIsGeneratingImage(true); setError("");
    try {
      const r = await fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: resultText, style: "realistic", personDesc, clothDesc, gender }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setGeneratedImageUrl(`data:${d.mimeType};base64,${d.imageBase64}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setIsGeneratingImage(false); }
  }, [resultText, personDesc, clothDesc, gender]);
  const handleClearCloset = () => { if (confirm("Delete all?")) setCloset([]); };
  const gOpts = lang === "vi" ? [{ v: "Nam", l: "Nam" }, { v: "Nữ", l: "Nữ" }] : [{ v: "Male", l: "Male" }, { v: "Female", l: "Female" }];

  return (
    <div className="min-h-screen" style={{ background: "#f5f0eb" }}>
      {showGenerateModal && (
        <GenerateImageModal onClose={() => setShowGenerateModal(false)}
          onUseImage={(b, m, p) => handleClothImagesChange([...clothImages, { id: crypto.randomUUID(), base64: b, mimeType: m, previewUrl: p, name: "AI Generated" }])} />
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(14px)", borderBottom: "1px solid #e8e4ef" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", borderRadius: 12, padding: 8, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#1a1a2e" }}>FitAI</h1>
              <p className="text-[11px]" style={{ color: "#888" }}>{t("app.subtitle")}</p>
            </div>
          </div>

          {/* TABS */}
          <div className="hidden sm:flex items-center gap-1" style={{ background: "#f0ece6", borderRadius: 14, padding: 3 }}>
            {(["studio","tryon","closet","recycle"] as Tab[]).map(tab => {
              const Icon = TAB_ICONS[tab];
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={activeTab === tab ? { background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", color: "#7c3aed" } : { color: "#888" }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200">
                  <Icon size={15} />
                  <span>{t(`tab.${tab}`)}</span>
                  {tab === "closet" && closet.length > 0 && (
                    <span style={{ background: "#7c3aed", color: "white", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>{closet.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8">
        {activeTab === "studio" && <div className="animate-fade-in"><DreaminaStudio /></div>}

        {activeTab === "tryon" && (
          <div className="animate-fade-in grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-1">
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e4ef", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <ImageUploader label={t("tryon.person.label")} hint={t("tryon.person.hint")} previewUrl={personPreview} onImageChange={(b,_,p) => { setPersonBase64(b); setPersonPreview(p); }} />
              </div>
              <BodyForm height={height} weight={weight} onChange={(f,v) => { if (f==="height") setHeight(v); else setWeight(v); }} />
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e4ef", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#333" }}>{t("tryon.gender")}</label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: "100%", border: "1px solid #ddd8e4", borderRadius: 12, padding: "10px 14px", fontSize: "0.9rem", background: "white", outline: "none" }}>
                  {gOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-1">
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e4ef", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <MultiImageUploader label={t("tryon.cloth.label")} hint={t("tryon.cloth.hint")} images={clothImages} onChange={handleClothImagesChange} maxImages={10} />
                {clothImages.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-semibold" style={{ color: "#444" }}>{t("tryon.cloth.select")}</p>
                    <p className="mb-2 text-xs" style={{ color: "#999" }}>{t("tryon.cloth.select.hint")} <span style={{ fontWeight: 600, color: "#7c3aed" }}>purple border</span></p>
                    <div className="grid grid-cols-4 gap-2">
                      {clothImages.map(img => (
                        <button key={img.id} type="button" onClick={() => setSelectedClothId(img.id)}
                          style={{ border: selectedClothId === img.id ? "2px solid #7c3aed" : "2px solid #e8e4ef", borderRadius: 12, overflow: "hidden", background: "#faf8f5", aspectRatio: "1/1", transition: "all 0.2s" }}>
                          <img src={img.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e4ef", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <label className="text-sm font-semibold" style={{ color: "#444" }}>{t("tryon.request")}</label>
                <textarea value={userRequest} onChange={e => setUserRequest(e.target.value)} placeholder={t("tryon.request.placeholder")}
                  style={{ width: "100%", marginTop: 8, border: "1px solid #ddd8e4", borderRadius: 12, padding: "10px 14px", fontSize: "0.9rem", minHeight: 80, resize: "none", outline: "none", background: "white" }} />
              </div>

              <button onClick={() => setShowGenerateModal(true)}
                style={{ border: "2px dashed #c4b5fd", borderRadius: 12, background: "#f5f3ff", padding: "12px 20px", color: "#7c3aed", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}>
                <ImagePlus size={16} className="inline mr-1" /> {t("tryon.generate")}
              </button>

              <div className="flex flex-col gap-2">
                <button onClick={() => handleTryOn()} disabled={!clothBase64 || isProcessing}
                  style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", border: "none", borderRadius: 12, padding: "14px 24px", fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 14px rgba(124,58,237,0.35)", cursor: "pointer", opacity: (!clothBase64 || isProcessing) ? 0.5 : 1 }}>
                  <Wand2 size={16} className="inline mr-1" /> {isProcessing ? t("tryon.button.loading") : t("tryon.button")}
                </button>
                <button onClick={handleAddToCloset} disabled={!clothImages.length && !clothBase64 || isAnalyzing}
                  style={{ border: "1px solid #e8e4ef", borderRadius: 12, background: "white", padding: "12px 24px", color: "#666", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer", opacity: (!clothImages.length && !clothBase64 || isAnalyzing) ? 0.4 : 1 }}>
                  <Plus size={15} className="inline mr-1" /> {isAnalyzing ? t("tryon.saving") : clothImages.length > 1 ? t("tryon.save.multi", { count: clothImages.length }) : t("tryon.save")}
                </button>
              </div>

              {error && (
                <div style={{ padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#dc2626", fontSize: "0.9rem" }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e4ef", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <TryOnResult resultText={resultText} generatedImageUrl={generatedImageUrl} isLoading={isProcessing} isGeneratingImage={isGeneratingImage} onGenerateImage={handleGenerateIllustration} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "closet" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>{t("closet.title")}</h2>
                <p className="text-sm mt-0.5" style={{ color: "#999" }}>{closet.length} {t("closet.count")}</p>
              </div>
              <div className="flex gap-2">
                {closet.length > 0 && (
                  <button onClick={handleClearCloset} style={{ border: "1px solid #fecaca", borderRadius: 12, padding: "8px 16px", color: "#dc2626", fontWeight: 500, fontSize: "0.85rem", background: "white", cursor: "pointer" }}>
                    <Trash2 size={14} className="inline mr-1" /> {t("closet.clear")}
                  </button>
                )}
                <button onClick={() => setActiveTab("tryon")} style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white", border: "none", borderRadius: 12, padding: "8px 16px", fontWeight: 600, fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(124,58,237,0.3)", cursor: "pointer" }}>
                  <Plus size={14} className="inline mr-1" /> {t("closet.add")}
                </button>
              </div>
            </div>

            {closet.length === 0 ? (
              <div style={{ border: "2px dashed #ddd8e4", borderRadius: 16, padding: "80px 20px", textAlign: "center", background: "rgba(255,255,255,0.5)" }}>
                <div style={{ background: "#f0ece6", borderRadius: "50%", padding: 24, display: "inline-block", marginBottom: 16 }}>
                  <Shirt size={40} style={{ color: "#ccc" }} />
                </div>
                <p className="font-semibold" style={{ color: "#777" }}>{t("closet.empty")}</p>
                <p className="text-sm mt-1" style={{ color: "#aaa" }}>{t("closet.empty.hint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {closet.map(item => <ClothingCard key={item.id} item={item} onTryOn={item => { setActiveTab("tryon"); handleTryOn(item); }} onDelete={handleDeleteFromCloset} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === "recycle" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#1a1a2e" }}>{t("recycle.title")}</h2>
              <p className="text-sm mt-0.5" style={{ color: "#999" }}>{t("recycle.subtitle")}</p>
            </div>
            <RecycleHub />
          </div>
        )}
      </main>

      {/* MOBILE NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(14px)", borderTop: "1px solid #e8e4ef" }} className="sm:hidden">
        <div className="flex items-center justify-around px-2 py-1.5">
          {(["studio","tryon","closet","recycle"] as Tab[]).map(tab => {
            const Icon = TAB_ICONS[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={activeTab === tab ? { color: "#7c3aed" } : { color: "#aaa" }}
                className="flex flex-col items-center gap-0.5 py-2 px-3">
                <Icon size={20} />
                <span style={{ fontSize: 9, fontWeight: 500 }}>{t(`tab.${tab}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LANGUAGE */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderRadius: 999, border: "1px solid #e8e4ef", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "4px 4px 4px 12px" }}>
          <Globe size={15} style={{ color: "#aaa" }} />
          {(["vi","en"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={lang === l ? { background: "#7c3aed", color: "white", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" } : { background: "transparent", color: "#888", border: "none", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
              {l === "vi" ? "VI" : "EN"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}